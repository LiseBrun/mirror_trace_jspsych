# packages ----------------------------------------------------------------

library(tidyverse)


# data import -------------------------------------------------------------

dataset_analysis <- read_rds("data/dataset_analysis.RData")

glimpse(dataset_analysis)


# data exclusion ----------------------------------------------------------

# attention check: participant 37 failed
dataset_analysis %>% 
  # remove whitespaces and convert to lower case
  mutate(attention = str_trim(str_to_lower(attention))) %>% 
  filter(attention != "baguette") %>% 
  count(subject, attention)

dataset_exclusion <- dataset_analysis %>% 
  # participant-level exclusions
  filter(subject != 37) %>% 
  group_by(subject) %>% 
  mutate(subject_mean_acc = mean(correct),
         subject_mean_rt  = mean(rt)) %>% 
  ungroup() %>% 
  filter(subject_mean_acc >= .70,
         # Participant 176 < .70 acc
         # Participants 45, 156, 160, 195 > 3*sd(mean_rt)
         3 * sd(subject_mean_rt) > abs(subject_mean_rt - mean(subject_mean_rt))
         ) %>%
  # trial-level exclusions
  filter(correct == TRUE,
         # RT cut-off
         rt > 300,
         rt < 1500)
  
# rt transform ------------------------------------------------------------

# compute lambda for box-cox transformation
boxcox_lambda <- 
  MASS::boxcox(rt ~ 1, data = dataset_exclusion) %>% 
  as_tibble() %>% 
  filter(y == max(y)) %>% 
  pull(x)

dataset_transform <- dataset_exclusion %>% 
  # calculating RT transformations
  mutate(rt_log = log(rt),
         rt_inv = 1 / rt,
         rt_bc = (rt^boxcox_lambda - 1) / boxcox_lambda)

dataset_transform %>% 
  gather(transform, score, starts_with("rt")) %>% 
  ggplot(aes(x = score)) +
  geom_histogram() +
  facet_wrap(~ transform, scales = "free_x")


# raincloud plot ----------------------------------------------------------
library(cowplot)
source("rainclouds.R") # see https://github.com/RainCloudPlots

# creates a dataset for the rain and the cloud of the plot
plot_dataset <- dataset_exclusion %>% 
  select(subject, rt, movement, valence) %>% 
  group_by(subject, movement, valence) %>% 
  summarise(rt = mean(rt)) %>% 
  ungroup()

# recode the variables for the raincloud plot: numeric factor-coded variables
plot_data <- plot_dataset %>% 
  mutate(movement = case_when(movement == "avoidance" ~ 1,
                              movement == "approach" ~ 2),
         prime = case_when(valence == "neg" ~ 1,
                           valence == "pos" ~ 2),
         movement = as_factor(movement),
         prime = as_factor(prime)) %>% 
  select(subject, movement, prime, rt)

# creates a summary dataset for the boxplot and mean + error bars
plot_data_summary <- plot_data %>% 
  group_by(movement, prime) %>% 
  summarise(N = n(),
            rt_mean = mean(rt),
            rt_median = median(rt),
            sd = sd(rt),
            se = sd / sqrt(N),
            ci = 1.96 * se)

# get the range of rt to define plot y limits
plot_data %>% pull(rt) %>% range()

# compute and display the raincloud plot
ggplot(plot_data, aes(x = movement, y = rt, fill = prime)) +
  geom_flat_violin(aes(fill = prime),
                   position = position_nudge(x = .15, y = 0), adjust = 1.5, 
                   trim = FALSE, alpha = .5, colour = NA) +
  geom_point(aes(x = as.numeric(movement) - .15, y = rt, colour = prime),
             position = position_jitter(width = .05), size = .25, shape = 20) +
  geom_boxplot(aes(x = movement, y = rt, fill = prime), notch = TRUE,
               outlier.shape = NA, alpha = .5, width = .1, colour = "black") +
  geom_line(data = plot_data_summary, 
            aes(x = as.numeric(movement) + .09, y = rt_mean, group = prime, 
                colour = prime), 
            linetype = 3, position = position_dodge(width = 0.05)) +
  geom_point(data = plot_data_summary, 
             aes(x = as.numeric(movement) + .09, y = rt_mean, group = prime, 
                 colour = prime), 
             shape = 18, position = position_dodge(width = 0.05)) +
  geom_errorbar(data = plot_data_summary, 
                aes(x = as.numeric(movement) + .09,y = rt_mean, group = prime, 
                    colour = prime, ymin = rt_mean - se, ymax = rt_mean + se),
                width = .05, position = position_dodge(width = 0.05)) +
  scale_y_continuous(breaks = seq(400, 1050, by = 50),
                     limits = c(400, 1050)) +
  scale_colour_brewer(palette = "Dark2") +
  scale_fill_brewer(palette = "Dark2") +
  ggtitle("Raincloud plot: movement x prime") +
  theme_classic(base_size = 15)

# mixed-model analysis ----------------------------------------------------
library(lmerTest)
library(RePsychLing)

dataset_mm <- dataset_transform %>% 
  # choose the best transform at DV = rt_***
  select(subject, DV = rt_bc, movement, valence, prime) %>% 
  # contrast-coding variables
  mutate(movement = case_when(movement == "avoidance" ~ 0,
                              movement == "approach"  ~ 1),
         valence = case_when(valence == "neg" ~ -0.5,
                             valence == "pos" ~ +0.5)) %>% 
  # renaming variables to simplify
  select(subject, DV, mvt = movement, val = valence, stim = prime)


# following Bates et al. (2018) mixed model parsimony procedure

m0 <- lmer(DV ~ mvt * val + (mvt * val | subject) + (mvt | stim),
           data = dataset_mm)

summary(rePCA(m0))

m1 <- lmer(DV ~ mvt * val + (mvt * val || subject) + (mvt || stim),
           data = dataset_mm)

summary(rePCA(m1))
VarCorr(m1)

# removing random variable with 0 sd: val|subject
m2 <- lmer(DV ~ mvt * val + (mvt + mvt:val || subject) + (mvt || stim),
           data = dataset_mm)

# comparing models with and without these random variables
anova(m1, m2)

VarCorr(m2)

# looping the mixed model parsimony procedure...
m3 <- lmer(DV ~ mvt * val + (mvt + mvt:val || subject) + (0 + mvt || stim),
           data = dataset_mm)

anova(m2, m3)

VarCorr(m3)

# getting back and testing correlations
m4 <- lmer(DV ~ mvt * val + (mvt + mvt:val | subject) + (0 + mvt | stim),
           data = dataset_mm)

anova(m3, m4)

# m3 seems to be most parsimonious and complete model

# application conditions
lattice::qqmath(residuals(m3))

plot(fitted(m3), residuals(m3))

plot(fitted(m3),(abs(residuals(m3)))^.5)
abline(lm((abs(residuals(m3)))^.5~fitted(m3)))

# results
summary(m3)

lattice::dotplot(ranef(m3))


# regular ANOVA -----------------------------------------------------------

# Calculating W for each effects
dataset_anova <- dataset_transform %>% 
  group_by(subject, movement, valence) %>% 
  # Choose the best RT transformation
  summarise(VD = mean(rt_bc)) %>% 
  ungroup() %>% 
  # Transform the DV to achieve residuals normality
  #mutate(VD = log(VD)) %>% 
  unite(movement, valence, sep = "_", col = "condition") %>% 
  spread(condition, VD) %>% 
  mutate(W_mvt = - 1 * approach_pos - 1 * approach_neg
         + 1 * avoidance_pos + 1 * avoidance_neg,
         
         W_val = - 1 * approach_pos + 1 * approach_neg
         - 1 * avoidance_pos + 1 * avoidance_neg,
         
         W_inte = - 1 * approach_pos + 1 * approach_neg
         + 1 * avoidance_pos - 1 * avoidance_neg,
         W_s_app = - 1 * approach_pos + 1 * approach_neg,
         W_s_avo = - 1 * avoidance_neg + 1 * avoidance_pos)

# main effect : mvt_incidental
lm_mvt <- lm(W_mvt ~ 1 , data = dataset_anova)

# main effect : prime_category
lm_cat <- lm(W_val ~ 1 , data = dataset_anova)

# moderation : mvt_incidental x prime_category
lm_inte <- lm(W_inte ~ 1 , data = dataset_anova)

# simple effect : prime_category effect in approach condition
lm_s_app <- lm(W_s_app ~ 1, data = dataset_anova)

# simple effect : prime_category effect in avoid condition
lm_s_avo <- lm(W_s_avo ~ 1, data = dataset_anova)

# main effect : mvt_incidental
summary(lm_mvt)

# main effect : prime_category
summary(lm_cat)

# moderation : mvt_incidental x prime_category
summary(lm_inte)

# simple effect : prime_category effect in approach condition
summary(lm_s_app)

# simple effect : prime_category effect in avoid condition
summary(lm_s_avo)

# count the number of participant automatically
n <- dataset_transform %>% count(subject) %>% nrow()

# moderation : mvt_incidental x prime_category
# pull the t used further to calculate the dz and it's confidence interval
t <- lm_inte %>%
  # transform the list into a dataframe
  broom::tidy() %>% 
  pull(statistic)

# compute the dz
dz <- t / sqrt(n)

# compute the confidence interval bounds of the dz and fill it into a list
ci <- MBESS::conf.limits.nct(t, n - 1) %>%
  map(~.x / sqrt(n))

# extract from the list the lower and upper bounds of the confidence interval
ci_low  <- ci$Lower.Limit
ci_high <- ci$Upper.Limit


# accuracy analysis -------------------------------------------------------

dataset_exclusion <- dataset_analysis %>% 
  # participant-level exclusions
  filter(subject != 37) %>% 
  group_by(subject) %>% 
  mutate(subject_mean_acc = mean(correct),
         subject_mean_rt  = mean(rt)) %>% 
  ungroup() %>% 
  filter(subject_mean_acc >= .70,
         # Participant 176 < .70 acc
         # Participants 45, 156, 160, 195 > 3*sd(mean_rt)
         3 * sd(subject_mean_rt) > abs(subject_mean_rt - mean(subject_mean_rt))
  ) %>% 
  mutate(acc = case_when(correct == TRUE  ~ 1,
                         correct == FALSE ~ 0))

# raincloud plot
library(cowplot)
source("rainclouds.R") # see https://github.com/RainCloudPlots

# creates a dataset for the rain and the cloud of the plot
plot_dataset <- dataset_exclusion %>% 
  select(subject, acc, movement, valence) %>% 
  group_by(subject, movement, valence) %>% 
  summarise(acc = mean(acc)) %>% 
  ungroup()

# recode the variables for the raincloud plot: numeric factor-coded variables
plot_data <- plot_dataset %>% 
  mutate(movement = case_when(movement == "avoidance" ~ 1,
                              movement == "approach" ~ 2),
         prime = case_when(valence == "neg" ~ 1,
                           valence == "pos" ~ 2),
         movement = as_factor(movement),
         prime = as_factor(prime)) %>% 
  select(subject, movement, prime, acc)

# creates a summary dataset for the boxplot and mean + error bars
plot_data_summary <- plot_data %>% 
  group_by(movement, prime) %>% 
  summarise(N = n(),
            acc_mean = mean(acc),
            acc_median = median(acc),
            sd = sd(acc),
            se = sd / sqrt(N),
            ci = 1.96 * se)

# get the range of acc to define plot y limits
plot_data %>% pull(acc) %>% range()

# compute and display the raincloud plot
ggplot(plot_data, aes(x = movement, y = acc, fill = prime)) +
  geom_flat_violin(aes(fill = prime),
                   position = position_nudge(x = .15, y = 0), adjust = 1.5, 
                   trim = FALSE, alpha = .5, colour = NA) +
  geom_point(aes(x = as.numeric(movement) - .15, y = acc, colour = prime),
             position = position_jitter(width = .05), size = .25, shape = 20) +
  # geom_boxplot(aes(x = movement, y = acc, fill = prime), notch = TRUE,
  #              outlier.shape = NA, alpha = .5, width = .1, colour = "black") +
  geom_line(data = plot_data_summary, 
            aes(x = as.numeric(movement) + .09, y = acc_mean, group = prime, 
                colour = prime), 
            linetype = 3, position = position_dodge(width = 0.05)) +
  geom_point(data = plot_data_summary, 
             aes(x = as.numeric(movement) + .09, y = acc_mean, group = prime, 
                 colour = prime), 
             shape = 18, position = position_dodge(width = 0.05)) +
  geom_errorbar(data = plot_data_summary, 
                aes(x = as.numeric(movement) + .09,y = acc_mean, group = prime, 
                    colour = prime, ymin = acc_mean - se, ymax = acc_mean + se),
                width = .05, position = position_dodge(width = 0.05)) +
  scale_y_continuous(breaks = seq(0.75, 1, by = 0.05),
                     limits = c(0.75, 1)) +
  scale_colour_brewer(palette = "Dark2") +
  scale_fill_brewer(palette = "Dark2") +
  ggtitle("Raincloud plot: movement x prime") +
  theme_classic(base_size = 15)

# mixed model analysis
library(lmerTest)
library(RePsychLing)

dataset_mm <- dataset_exclusion %>% 
  select(subject, DV = acc, movement, valence, prime) %>% 
  # contrast-coding variables
  mutate(movement = case_when(movement == "avoidance" ~ 0,
                              movement == "approach"  ~ 1),
         valence = case_when(valence == "neg" ~ -0.5,
                             valence == "pos" ~ +0.5)) %>% 
  # renaming variables to simplify
  select(subject, DV, mvt = movement, val = valence, stim = prime)


# following Bates et al. (2018) mixed model parsimony procedure

m0 <- lmer(DV ~ mvt * val + (mvt * val | subject) + (mvt | stim),
           data = dataset_mm)

summary(rePCA(m0))

m1 <- lmer(DV ~ mvt * val + (mvt * val || subject) + (mvt || stim),
           data = dataset_mm)

summary(rePCA(m1))
VarCorr(m1)

# removing random variable with 0 sd: val|subject
m2 <- lmer(DV ~ mvt * val + (mvt + mvt:val || subject) + (0 + mvt || stim),
           data = dataset_mm)

# comparing models with and without these random variables
anova(m1, m2)

VarCorr(m2)

# looping the mixed model parsimony procedure...
m3 <- lmer(DV ~ mvt * val + (mvt || subject) + (0 + mvt || stim),
           data = dataset_mm)

anova(m2, m3)

VarCorr(m3)

# looping the mixed model parsimony procedure...
m4 <- lmer(DV ~ mvt * val + (mvt || subject),
           data = dataset_mm)

anova(m3, m4)

VarCorr(m4)

# getting back and testing correlations
m5 <- lmer(DV ~ mvt * val + (mvt | subject),
           data = dataset_mm)

anova(m4, m5)

# m4 seems to be most parsimonious and complete model

# application conditions
lattice::qqmath(residuals(m4))

plot(fitted(m4), residuals(m4))

plot(fitted(m4),(abs(residuals(m4)))^.5)
abline(lm((abs(residuals(m4)))^.5~fitted(m4)))

# results
summary(m4)

lattice::dotplot(ranef(m4))

# regular anova analysis
dataset_anova <- dataset_exclusion %>% 
  group_by(subject, movement, valence) %>% 
  # Choose the best RT transformation
  summarise(VD = mean(acc)) %>% 
  ungroup() %>% 
  # Transform the DV to achieve residuals normality
  #mutate(VD = log(VD)) %>% 
  unite(movement, valence, sep = "_", col = "condition") %>% 
  spread(condition, VD) %>% 
  mutate(W_mvt = - 1 * approach_pos - 1 * approach_neg
         + 1 * avoidance_pos + 1 * avoidance_neg,
         
         W_val = - 1 * approach_pos + 1 * approach_neg
         - 1 * avoidance_pos + 1 * avoidance_neg,
         
         W_inte = + 1 * approach_pos - 1 * approach_neg
         - 1 * avoidance_pos + 1 * avoidance_neg,
         W_s_app = - 1 * approach_pos + 1 * approach_neg,
         W_s_avo = - 1 * avoidance_neg + 1 * avoidance_pos)

# main effect : mvt_incidental
lm_mvt <- lm(W_mvt ~ 1 , data = dataset_anova)

# main effect : prime_category
lm_cat <- lm(W_val ~ 1 , data = dataset_anova)

# moderation : mvt_incidental x prime_category
lm_inte <- lm(W_inte ~ 1 , data = dataset_anova)

# simple effect : prime_category effect in approach condition
lm_s_app <- lm(W_s_app ~ 1, data = dataset_anova)

# simple effect : prime_category effect in avoid condition
lm_s_avo <- lm(W_s_avo ~ 1, data = dataset_anova)

# main effect : mvt_incidental
summary(lm_mvt)

# main effect : prime_category
summary(lm_cat)

# moderation : mvt_incidental x prime_category
summary(lm_inte)

# simple effect : prime_category effect in approach condition
summary(lm_s_app)

# simple effect : prime_category effect in avoid condition
summary(lm_s_avo)

# count the number of participant automatically
n <- dataset_exclusion %>% count(subject) %>% nrow()

# moderation : mvt_incidental x prime_category
# pull the t used further to calculate the dz and it's confidence interval
t <- lm_inte %>%
  # transform the list into a dataframe
  broom::tidy() %>% 
  pull(statistic)

# compute the dz
dz <- t / sqrt(n)

# compute the confidence interval bounds of the dz and fill it into a list
ci <- MBESS::conf.limits.nct(t, n - 1) %>%
  map(~.x / sqrt(n))

# extract from the list the lower and upper bounds of the confidence interval
ci_low  <- ci$Lower.Limit
ci_high <- ci$Upper.Limit

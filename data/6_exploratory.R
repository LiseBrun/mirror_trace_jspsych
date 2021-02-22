library(tidyverse)
library(hrbrthemes)
library(lme4)
library(lmerTest)
library(modelr)
library(ggbeeswarm)
library(broom)
library(glue)

theme_set(theme_ipsum())

dataset <-
  read_rds("data/dataset_tidy.RData") %>% 
  select(session_id,
         starts_with("cond"),
         iat_data) %>% 
  drop_na() %>% 
  unnest() %>% 
  filter(rt > 400,
         rt < 10000,
         iat_type == "test") %>% 
  mutate(rt = (rt^(-1) - 1 / (-1)),
         iat_block_type = 
           case_when(
             iat_label_left == "SELF-LUUPITE" | iat_label_right == "SELF-LUUPITE" ~ "self_luupite",
             iat_label_left == "SELF-NIFFITE" | iat_label_right == "SELF-NIFFITE" ~ "self_niffite"
           ),
         iat_block_type_c = 
           JSmediation::build_contrast(iat_block_type,
                                       "self_luupite",
                                       "self_niffite"),
         cond_approach_training_c = 
           JSmediation::build_contrast(cond_approach_training,
                                       "niffite",
                                       "luupite"),
         iat_category_c = 
           JSmediation::build_contrast(iat_category,
                                       "luupite-niffite",
                                       "self-other"),
         iat_list_type_c = 
           case_when(str_detect(stimulus, "nif$") ~ -1,
                     str_detect(stimulus, "lup$") ~  1,
                     TRUE                         ~  0),
         iat_target_type_c =
           case_when(str_detect(stimulus, "I|mine|me|my")                ~  1,
                     str_detect(stimulus, "they|themselves|them|theirs") ~ -1,
                     TRUE                                                ~  0)
         ) 

dataset %>% pull(stimulus) %>% unique(
  
)
dataset %>% 
  ggplot(aes(x = rt)) +
  geom_histogram()

lm(rt ~ iat_block_type_c * cond_approach_training_c,
   data = dataset) %>% 
  summary()

model <- lmer(
  rt ~ iat_block_type_c * cond_approach_training_c * (iat_category_c + iat_list_type_c + iat_target_type_c) +
    (iat_block_type_c | session_id) +
    (1 | stimulus),
  data = dataset)

summary(model)

dataset %>% 
  add_predictions(model) %>% 
  ggplot(aes(y = pred, x = iat_list, color = iat_category)) +
  geom_smooth(method = "lm", se = FALSE) 
  
model %>% 
  broom.mixed::tidy(conf.int = TRUE,
                    conf.method = "Wald") %>% 
  filter(effect == "fixed",
         term   != "(Intercept)") %>% 
  mutate(term = 
           term %>% 
           str_replace_all("_c(?=:|$)", "") %>% 
           str_replace_all("_", " ") %>% 
           str_replace_all(":", " × "),
         apa = glue("t({df}) = {t}, p = {p}",
                    df = round(df, 2),
                    t  = round(statistic, 2),
                    p  = round(p.value, 3)),
         term = fct_reorder(term, estimate)) %>% 
  ggplot(aes(y = term)) + 
  geom_point(aes(x = estimate)) + 
  geom_segment(aes(x    = conf.low,
                   xend = conf.high,
                   yend = term)) +
  ggrepel::geom_text_repel(aes(x = estimate, label = apa),
                           segment.alpha = 0,
                           size  = 3,
                           nudge_x = 4,
                           direction = "y") +
  geom_vline(xintercept = 0, linetype = "dotted") +
  xlim(-2e-04, 6e-04)


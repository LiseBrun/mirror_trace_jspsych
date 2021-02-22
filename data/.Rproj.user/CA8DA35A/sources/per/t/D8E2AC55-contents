# packages ----------------------------------------------------------------
library(tidyverse)
library(hrbrthemes)

# workspace ---------------------------------------------------------------
theme_set(hrbrthemes::theme_ipsum())

dataset <- 
  read_rds("data/dataset_tidy_summary.RData") %>% 
  filter(status == "APPROVED")

# exploration -------------------------------------------------------------
dataset %>% 
  ggplot(aes(x = age, fill = Sex)) + 
  geom_histogram(alpha = .8) +
  scale_fill_ipsum()

dataset %>% 
  mutate(`Current Country of Residence` = fct_inorder(`Current Country of Residence`)) %>% 
  ggplot(aes(x = `Current Country of Residence`)) + 
  geom_bar()

dataset %>% 
  ggplot(aes(x = age, y = time_taken / 60)) +
  geom_point()

dataset %>% 
  ggplot(aes(x = started_datetime, y = time_taken / 60)) +
  geom_point()

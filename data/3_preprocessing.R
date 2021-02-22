# packages ----------------------------------------------------------------
library(tidyverse)
library(reshape2)

# data import -------------------------------------------------------------
dataset_tidy <- read_rds("data/dataset_tidy.RData")

glimpse(dataset_tidy)

dataset_participant <- read_rds("data/dataset_participant.RData")

# data pre-processing -------------------------------------------------------
# creates a subject number by participant
participant_number <- dataset_participant %>% 
  mutate(subject = row_number()) %>% 
  select(subject, session_id)

# retains only relevant data
dataset_analysis <-
  dataset_tidy %>% 
  drop_na() %>% 
  select(-starts_with("event"),
         -starts_with("connection")) %>% 
  unnest() %>% 
  filter(phase == "test",
         trial_type == "vaast-image",
         position == 2) %>% 
  # paste participant number
  left_join(participant_number, by = "session_id") %>% 
  select(subject, everything(), -stimulus, -trial_type)

glimpse(dataset_analysis)

write_rds(dataset_analysis, "data/dataset_analysis.Rdata")

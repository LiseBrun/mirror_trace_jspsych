# package import ----------------------------------------------------------
library(tidyverse)
library(jsonlite)
library(glue)

# custom functions --------------------------------------------------------

# database import ---------------------------------------------------------
database <-
  fireData::download("https://incidental-replication-test.firebaseio.com", "/") %>% 
  write_rds(glue("backup/{as.integer(Sys.time())}.RData")) 

# participant dataset -----------------------------------------------------
dataset_participant <-
  database %>% 
  pluck("participant_id_VAAST_incidente") %>% 
  map_dfr(~data_frame(epoch = .x$timestamp,
                      session_id = .x$jspsych_id,
                      prolific_id = .x$prolific_id,
                      vaast_condition_approach = .x$vaast_condition_approach)) %>% 
  mutate(timestamp = lubridate::as_datetime(epoch / 1000 )) 

# vaast dataset -----------------------------------------------------------
dataset_vaast_trial <-
  database %>% 
  pluck("vaast_trial_incidente") %>% 
  map_dfr(~data_frame(epoch = .x$timestamp,
                       session_id = .x$jspsych_id,
                       temp_data = .x$vaast_trial_data)) %>% 
    mutate(timestamp = lubridate::as_datetime(epoch / 1000 ),
           temp_data = map(temp_data, ~ fromJSON(.x))) %>% 
    unnest()

# browser event dataset ---------------------------------------------------
dataset_browser_event <-
  database %>% 
  pluck("browser_event_VAAST_incidente") %>% 
  map_dfr(~data_frame(epoch = .x$timestamp,
                      prolific_id = .x$prolific_id,
                      session_id = .x$jspsych_id,
                      temp_data = .x$event_data,
                      completion = .x$completion),
          .id = "id") %>%
  group_by(session_id) %>%
  arrange(desc(epoch)) %>% 
  filter(row_number() == 1) %>% 
  ungroup() %>% 
  mutate(timestamp = lubridate::as_datetime(epoch / 1000),
         temp_data = map(temp_data, ~ fromJSON(.x))) %>% 
  unnest()

# attention info dataset --------------------------------------------------
dataset_attention <-
  database %>% 
  pluck("attention_info_VAAST_incidente") %>% 
  map_dfr(~data_frame(epoch = .x$timestamp,
                      session_id = .x$jspsych_id,
                      temp_data = .x$attention_data),
          .id = "id") %>% 
  mutate(timestamp = lubridate::as_datetime(epoch / 1000),
         temp_data = map(temp_data, ~ fromJSON(.x))) %>% 
  unnest() %>%
  mutate(temp_data = map(responses, ~ fromJSON(.x))) %>% 
  group_by(session_id) %>% 
  mutate(attention = temp_data[internal_node_id == "0.0-9.0"]) %>% 
  select(session_id, attention) %>% 
  rowwise() %>% 
  mutate(attention = pluck(attention, 1)) %>% 
  ungroup() %>% 
  distinct() 


# extra info dataset -----------------------------------------------------
dataset_extra <-
  database %>% 
  pluck("extra_info_VAAST_incidente") %>% 
  map_dfr(~data_frame(epoch = .x$timestamp,
                      session_id = .x$jspsych_id,
                      temp_data = .x$extra_data),
          .id = "id") %>% 
  mutate(timestamp = lubridate::as_datetime(epoch / 1000),
         temp_data = map(temp_data, ~ fromJSON(.x))) %>% 
  unnest() %>%
  mutate(temp_data = map(responses, ~ fromJSON(.x))) %>% 
  group_by(session_id) %>% 
  mutate(age     = temp_data[internal_node_id == "0.0-19.0-0.0"],
         sex     = temp_data[internal_node_id == "0.0-20.0"],
         english = temp_data[internal_node_id == "0.0-21.0"],
         remark  = temp_data[internal_node_id == "0.0-22.0"]) %>% 
  select(session_id, age, sex, english, remark) %>% 
  rowwise() %>% 
  mutate(age     = pluck(age, 1),
         sex     = str_sub(pluck(sex, 1), 6, -1),
         english = str_sub(pluck(english, 1), 6, -1),
         remark  = pluck(remark, 1)) %>% 
  ungroup() %>%
  distinct() 


# connections -------------------------------------------------------------
dataset_connection <-
  database %>% 
  pluck("VAAST_incidente") %>%
  map_dfr(~data_frame(data = list(pluck(.x))),
          .id = "session_id") %>% 
  unnest() %>% 
  mutate(data = map(data, ~data_frame(epoch  = .x$timestamp,
                                      status = .x$status) %>% 
                      mutate(timestamp = lubridate::as_datetime(epoch / 1000))
                             )) %>% 
  unnest()

# export ------------------------------------------------------------------
map2(list(dataset_browser_event,
          dataset_participant,
          dataset_vaast_trial,
          dataset_connection,
          dataset_attention,
          dataset_extra),
     list("dataset_browser_event",
          "dataset_participant",
          "dataset_vaast_trial",
          "dataset_connection",
          "dataset_attention",
          "dataset_extra"),
     ~write_rds(.x, glue("data/{.y}.RData")))



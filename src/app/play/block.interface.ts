export interface BlockTemplate {
  number_actions: number;
  number_states: number;
  trial_start_number: number;
  trial_end_number: number;
  state_transition: string;
  reward_transition: string;
  image_transition: string;
  background_images: string[];
  negative_images: string[];
  additional_params: { [key: string]: any };
  display_instructions: string[];
  instructions: string[];
}

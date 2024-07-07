export interface BlockTemplate {
  number_actions: number;
  number_states: number;
  number_trials: number;
  state_transition: string;
  reward_transition: string;
  image_transition: string;
  background_images: string[];
  negative_images: string[];
  additional_params: { [key: string]: any };
  instructions: string[];
}

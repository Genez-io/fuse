import { mongoose  } from 'mongoose';

const wp_optionsSchema = new mongoose.Schema({
	option_name: {
		type: String,
		required: true,
	},
	option_value: {
		type: String,
		required: true,
	},
});

export const wp_options = mongoose.models.wp_options || mongoose.model('wp_options', wp_optionsSchema);

import { mongoose  } from 'mongoose';

const wp_tagsSchema = new mongoose.Schema({
	tag_value: {
		type: String,
		required: false,
	},
});

export const wp_tags = mongoose.models.wp_tags || mongoose.model('wp_tags', wp_tagsSchema);

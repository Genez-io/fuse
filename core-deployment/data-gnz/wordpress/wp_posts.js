import { mongoose  } from 'mongoose';

const wp_postsSchema = new mongoose.Schema({
	post_author: {
		type: String,
		required: true,
	},
	post_date: {
		type: Date,
		required: true,
		default: Date.now,
	},
	post_content: {
		type: String,
		required: true,
	},
	post_title: {
		type: String,
		required: true,
	},
	post_excerpt: {
		type: String,
		required: false,
	},
	post_status: {
		type: String,
		required: true,
		default: 'active',
	},
	post_tags: {
		type: [String],
		required: false,
	},
	comment_count: {
		type: Number,
		required: true,
		default: 0,
	},
});

export const wp_posts = mongoose.models.wp_posts || mongoose.model('wp_posts', wp_postsSchema);

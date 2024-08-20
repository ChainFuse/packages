export enum PostEvents {
	created = 'post_created',
	edited = 'post_edited',
	destroyed = 'post_destroyed',
	recovered = 'post_recovered',
}

export interface TopicPost extends Record<string, any> {
	id: number;
	name: string;
	username: string;
	avatar_template: string;
	created_at: ReturnType<Date['toISOString']>;
	cooked: string;
	post_number: number;
	post_type: number;
	updated_at: ReturnType<Date['toISOString']>;
	reply_count: number;
	reply_to_post_number: string | null;
	quote_count: number;
	incoming_link_count: number;
	reads: number;
	readers_count: number;
	score: number;
	yours: boolean;
	topic_id: number;
	topic_slug: string;
	display_username: string;
	flair_name: string | null;
	flair_url: string | null;
	flair_bg_color: string | null;
	flair_color: string | null;
	version: number;
	can_edit: boolean;
	can_delete: boolean;
	can_recover: boolean;
	can_see_hidden_post?: boolean;
	can_wiki: boolean;
	link_counts: {
		url: string;
		internal: boolean;
		reflection: boolean;
		title: string;
		clicks: number;
	}[];
	read: boolean;
	user_title: string | null;
	bookmarked: boolean;
	actions_summary: {
		id: number;
		can_act: boolean;
	}[];
	moderator: boolean;
	admin: boolean;
	staff: boolean;
	user_id: number;
	hidden: boolean;
	trust_level: number;
	deleted_at: ReturnType<Date['toISOString']>;
	user_deleted: boolean;
	edit_reason: string | null;
	can_view_edit_history: number;
	wiki: boolean;
	reviewable_id: number;
	reviewable_score_count: number;
	reviewable_score_pending_count: number;
}

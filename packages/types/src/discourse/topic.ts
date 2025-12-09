import type { TopicPost } from './post';

export enum TopicEvents {
	created = 'topic_created',
	revised = 'topic_revised',
	edited = 'topic_edited',
	destroyed = 'topic_destroyed',
	recovered = 'topic_recovered',
	asdf = 'topic_closed_status_updated',
	autoclosed_status_updated = 'topic_autoclosed_status_updated',
	visible_status_updated = 'topic_visible_status_updated',
}

export interface TopicCollections extends Record<string, any> {
	topic_list: TopicList;
}
interface TopicList extends Record<string, any> {
	topics: Topic[];
}

export interface TopicUser {
	id: number;
	username: string;
	name: string;
	avatar_template: string;
}

export interface Topic extends Record<string, any> {
	post_stream: {
		posts: TopicPost[];
		stream: any[];
	};
	suggested_topics: Record<string, any>[];
	timeline_lookup: any[];
	tags_descriptions: Record<string, any>;
	id: number;
	title: string;
	fancy_title: string;
	posts_count: number;
	created_at: ReturnType<Date['toISOString']>;
	views: number;
	reply_count: number;
	like_count: number;
	last_posted_at: ReturnType<Date['toISOString']>;
	visible: boolean;
	closed: boolean;
	archived: boolean;
	has_summary: boolean;
	archetype: string;
	slug: string;
	category_id: number;
	word_count: number | null;
	deleted_at: ReturnType<Date['toISOString']> | null;
	user_id: number;
	featured_link: string | null;
	pinned_globally: boolean;
	pinned_at: ReturnType<Date['toISOString']> | null;
	pinned_until: ReturnType<Date['toISOString']> | null;
	image_url: string | null;
	slow_mode_seconds: number;
	draft: string | null;
	draft_key: string;
	draft_sequence: number;
	unpinned: string | null;
	pinned: boolean;
	current_post_number: number;
	highest_post_number: number | null;
	deleted_by: ReturnType<Date['toISOString']> | null;
	has_deleted: number;
	actions_summary: {
		id: number;
		count: number;
		hidden: boolean;
		can_act: boolean;
	}[];
	chunk_size: number;
	bookmarked: boolean;
	bookmarks: any[];
	topic_timer: string | null;
	message_bus_last_id: number;
	participant_count: number;
	show_read_indicator: boolean;
	thumbnails: string | null;
	slow_mode_enabled_until: string | null;
	summarizable: boolean;
	details: {
		can_edit: boolean;
		notification_level: number;
		can_move_posts: boolean;
		can_delete: boolean;
		can_remove_allowed_users: boolean;
		can_create_post: boolean;
		can_reply_as_new_topic: boolean;
		can_invite_to?: boolean;
		can_invite_via_email?: boolean;
		can_flag_topic?: boolean;
		can_convert_topic: boolean;
		can_review_topic: boolean;
		can_close_topic: boolean;
		can_archive_topic: boolean;
		can_split_merge_topic: boolean;
		can_edit_staff_notes: boolean;
		can_toggle_topic_visibility: boolean;
		can_pin_unpin_topic: boolean;
		can_moderate_category: boolean;
		can_remove_self_id: boolean;
		participants?: {
			id: number;
			username: string;
			name: string;
			avatar_template: string;
			post_count: number;
			primary_group_name: string | null;
			flair_name: string | null;
			flair_url: string | null;
			flair_color: string | null;
			flair_bg_color: string | null;
			flair_group_id: string | null;
			admin: boolean;
			moderator: boolean;
			trust_level: number;
		}[];
		created_by: TopicUser;
		last_poster: TopicUser;
	};
}

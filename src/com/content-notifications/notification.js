import {h, Component}	 				from 'preact/preact';
import NavLink 							from 'com/nav-link/link';
import SVGIcon 							from 'com/svg-icon/icon';


export const noteAuthorIsAmongNodeAuthors = ( notification ) => {
	const {node, note} = notification;
	return note
		.map(n => node.authors.indexOf(n.author) > -1)
		.indexOf(true) > -1;
};

export const callerIDIsAmongNodeAuthors = ( notification ) => {
	return notification.node.authors.indexOf(notification.callerId) > -1;
};

export const isNotificationType = (notification, notificationType) => {
	return notification.notification
		.map(e => e.type)
		.indexOf(notificationType) > -1;
};

export const isNotificationMention = (notification) => {
	return isNotificationType(notification, 'mention');
};

export const isNotificationFeedback = (notification) => {
	return isNotificationType(notification, 'feedback') || (isNotificationType(notification, 'note') && callerIDIsAmongNodeAuthors(notification));
};

export const isNotificationFriendGame = (notification) => {
	return isNotificationType(notification, 'item');
};

export const isNotificationFriendPost = (notification) => {
	return isNotificationType(notification, 'post');
};

export const isNotificationComment = (notification) => {
	return isNotificationType(notification, 'note') && !callerIDIsAmongNodeAuthors(notification);
};

export const isNotificationOther = (notification) => {
	return !isNotificationType(notification, 'note') && !isNotificationType(notification, 'node') && !isNotificationType(notification, 'item') && !isNotificationType(notification, 'post') && !isNotificationType(notification, 'mention') && !isNotificationType(notification, 'feedback');
};

export default class NotificationItem extends Component {

	constructor( props ) {
		super(props);
	}

	getSocialStringList( authors, relation ) {
		let isRelation = authors.map((a) => relation.indexOf(a) > -1);
		let anyRelation = isRelation.length > 0 ? isRelation.reduce((l, r) => l || r) : false;
		let names = '';
		let Relations = [];

		if (anyRelation) {

			isRelation.forEach((e, i) => {
				if ( e ) {
					Relations.push('<NavLink class=\'-at-name\'>@' + authors[i] + '</NavLink>');
				}
			});
			if ( Relations.length > 3 ) {
				names = Relations.slice(0, 3).join(', ') + ' & more';
			}
			else if ( Relations.length > 1 ) {
				names = Relations.slice(0, Relations.length - 1).join(', ') + ' & ' + Relations[Relations.length - 1];
			}
			else {
				names = Relations[0];
			}

		}

		return {"count": Relations.length, "string": names};

	}

	isNoteNodeAuthor( node, note ) {
		return note && note.length == 1 ? node.authors.indexOf(note[0].author) > -1 : false;
	}

	getNodeAuthorAsSubjectJSX( notification ) {
		const {node, social, users, callerID} = notification;
		const friends = this.getSocialStringList(node.authors, social.friends);
		if ( node.authors.indexOf(callerID) > -1) {
			return <span>You</span>;
		}
		else if ( friends.count > 0 ) {
			return (<span>Your friend{friends.count > 1 ? 's' : ''} {friends.string}</span>);
		}
		else {
			const following = this.getSocialStringList(node.authors, social.following);
			if ( following.count > 0 ) {
				return <span>{following.string}</span>;
			}
			else {
				return (<span><NavLink class="-at-name">@{users.get(node.author).name}</NavLink></span>);
			}
		}
	}

	getNodeAuthorAsObjectJSX( notification ) {
		const {node, social, users, callerID, note} = notification;
		const friends = this.getSocialStringList(node.authors, social.friends);
		if ( node.authors.indexOf(callerID) > -1) {
			return <span>your</span>;
		}
		else if (this.isNoteNodeAuthor(node, note)) {
			return <span>their</span>;
		}
		else if ( friends.count > 0 ) {
			return (<span>your friend{friends.count > 1 ? 's' : ''} {friends.string}</span>);
		}
		else {
			const following = this.getSocialStringList(node.authors, social.following);
			if ( following.count > 0 ) {
				return (<span>{following.string}</span>);
			}
			else {
				return (<span><NavLink class="-at-name">@{users.get(node.author).name}</NavLink></span>);
			}
		}
	}

	getNoteAuthorAsSubjectJSX( notification ) {
		const {note, social, users, callerID} = notification;
		const noteAuthors = note.map(n => n.author);
		const friends = this.getSocialStringList(noteAuthors, social.friends);

		if ( noteAuthors.indexOf(callerID) > -1) {
			return <span>You</span>;
		}
		else if ( friends.count > 0 ) {
			noteAuthor = (<span>Your friend{friends.count > 1 ? 's' : ''} {friends.string}</span>);
		}
		else {
			const following = this.getSocialStringList(noteAuthors, social.following);
			if ( following.count > 0 ) {
				return <span>{following.string}</span>;
			}
			else if (noteAuthors.length > 1) {
				return <span>{noteAuthors.length} users</span>;
			}
			else if (noteAuthors.length == 1 && users.get(noteAuthors[0])) {
				return <span><NavLink class="-at-name">@{users.get(noteAuthors[0]).name}</NavLink></span>;
			}
			else {
				return <span>Someone</span>;
			}
		}
	}

	getNodeType( notification ) {
		let nodeType = notification.node.type;
		if ( notification.node.subtype ) {
			nodeType = notification.node.subtype;
		}
		return nodeType;
	}

	getNavProps( props ) {
		const {notification} = props;
		const notificationData = notification.notification[0];
		const navProps = {"href": notification.node.path, "title": ('Notification Id: ' + notificationData.id), "class": props.class, "id": props.id};

		if ( notification.note ) {
			navProps.href += "#/comment-" + notification.earliestNote;
		}
		return navProps;
	}

	getTimePrefix( notification ) {
		const date_now = new Date();
		const time_diff = (date_now.getTime() - notification.time);
		const timePrefix = getRoughAge(time_diff);
		return timePrefix;
	}

	renderOther( notification, timePrefix, navProps ) {
		const NodeType = this.getNodeType(notification);
		const NotificationType = notification.notification[0].type;
		const {node} = notification;

		if (notification.note) {
			const NoteAuthor = this.getNoteAuthorAsSubjectJSX(notification);
			const NodeAuthor = this.getNodeAuthorAsObjectJSX(notification);
			return (
				<NavLink {...navProps} >
					<SVGIcon>quesition</SVGIcon>{timePrefix} {NoteAuthor} caused unhandled notification {NotificationType} for {NodeAuthor} {NodeType} "<em>{node.name}</em>"
				</NavLink>
			);
		}
		else {
			const NodeAuthor = this.getNodeAuthorAsSubjectJSX(notification);
			return (
				<NavLink {...navProps} >
					<SVGIcon>quesition</SVGIcon>{timePrefix} {NodeAuthor} caused unhandled notification {NotificationType} with their {NodeType} "<em>{node.name}</em>"
				</NavLink>
			);
		}
	}

	renderFeedback( notification, timePrefix, navProps) {
		const NoteAuthor = this.getNoteAuthorAsSubjectJSX(notification);
		const NodeType = this.getNodeType(notification);
		const {node} = notification;

		return (
			<NavLink {...navProps} >
				<SVGIcon>bubble-empty</SVGIcon>{timePrefix} {NoteAuthor} commented on your {NodeType} "<em>{node.name}</em>"
			</NavLink>
		);
	}

	renderComment( notification, timePrefix, navProps) {
		const NoteAuthor = this.getNoteAuthorAsSubjectJSX(notification);
		const NodeAuthor = this.getNodeAuthorAsObjectJSX(notification);
		const NodeType = this.getNodeType(notification);
		const {node, note} = notification;

		return (
			<NavLink {...navProps} >
				<SVGIcon>{note.length > 1 ? 'bubbles' : 'bubble'}</SVGIcon>{timePrefix} {NoteAuthor} commented on {NodeAuthor} {NodeType} "<em>{node.name}</em>"
			</NavLink>
		);
	}

	renderFriendsItem( notification, timePrefix, navProps ) {
		const NodeAuthor = this.getNodeAuthorAsSubjectJSX(notification);
		const NodeType = this.getNodeType(notification);
		const {node} = notification;

		return (
			<NavLink {...navProps} >
				<SVGIcon>gamepad</SVGIcon> {timePrefix} {NodeAuthor} published a {NodeType} "<em>{node.name}</em>"
			</NavLink>
		);
	}

	renderFriendsPost( notification, timePrefix, navProps ) {
		const NodeAuthor = this.getNodeAuthorAsSubjectJSX(notification);
		const {node} = notification;

		return (
			<NavLink {...navProps} >
				<SVGIcon>feed</SVGIcon> {timePrefix} {NodeAuthor} posted "<em>{node.name}</em>"
			</NavLink>
		);
	}

	renderMention( notification, timePrefix, navProps) {
		const {node} = notification;
		const NodeType = this.getNodeType(notification);

		if (notification.note) {
			const NoteAuthor = this.getNoteAuthorAsSubjectJSX(notification);
			const NodeAuthor = this.getNodeAuthorAsObjectJSX(notification);
			return (
				<NavLink {...navProps} >
					<SVGIcon>at</SVGIcon> {timePrefix} {NoteAuthor} mentioned you in a comment on {NodeAuthor} {NodeType} "<em>{node.name}</em>"
				</NavLink>
			);
		}
		else {
			const NodeAuthor = this.getNodeAuthorAsSubjectJSX(notification);
			return (
				<NavLink {...navProps} >
					<SVGIcon>at</SVGIcon> {timePrefix} {NodeAuthor} mentioned you in their {NodeType} "<em>{node.name}</em>"
				</NavLink>
			);
		}
	}

	render( props, state ) {

		const {notification} = props;
		const navProps = this.getNavProps(props);
		const timePrefix = this.getTimePrefix(notification);

		if (isNotificationFeedback(notification)) {
			return this.renderFeedback(notification, timePrefix, navProps);
		}
		else if (isNotificationMention(notification)) {
			return this.renderMention(notification, timePrefix, navProps);
		}
		else if (isNotificationFriendGame(notification)) {
			return this.renderFriendsItem(notification, timePrefix, navProps);
		}
		else if (isNotificationFriendPost(notification)) {
			return this.renderFriendsPost(notification, timePrefix, navProps);
		}
		else if (isNotificationComment(notification)) {
			return this.renderComment(notification, timePrefix, navProps);
		}
		else if (isNotificationOther(notification)) {
			return this.renderOther(notification, timePrefix, navProps);
		}
		else {
			//ERROR
			console.log("[ERROR: bad notification]", notification);
		}
	}
}

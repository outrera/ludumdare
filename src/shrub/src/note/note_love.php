<?php

function noteLove_CountByNode( $node ) {
	$ret = db_QueryFetch(
		"SELECT note, COUNT(note) AS count, ".DB_FIELD_DATE('MAX(timestamp)','timestamp')."
		FROM ".SH_TABLE_PREFIX.SH_TABLE_NOTE_LOVE." 
		WHERE $node=?
		GROUP BY note;",
		$node
	);

	return $ret;	
}

function noteLove_GetByNote( $notes ) {
	$multi = is_array($notes);
	if ( !$multi )
		$notes = [$notes];
	
	if ( is_array($notes) ) {
		// Confirm that all Notes are not zero
		foreach( $notes as $note ) {
			if ( intval($note) == 0 )
				return null;
		}

		// Build IN string
		$note_string = implode(',', $notes);

		$ret = db_QueryFetch(
			"SELECT note, COUNT(note) AS count, ".DB_FIELD_DATE('MAX(timestamp)','timestamp')."
			FROM ".SH_TABLE_PREFIX.SH_TABLE_NOTE_LOVE." 
			WHERE note IN ($note_string)
			GROUP BY note".($multi?';':' LIMIT 1;')
		);
		
		if ( $multi )
			return $ret;
		else
			return $ret ? $ret[0] : null;
	}
	
	return null;
}

/// Can only add 1 love at a time
function noteLove_AddByNote( $note, $author ) {
	if ( is_array($note) ) {
		return null;
	}
	
	if ( !$note )
		return null;

	// Anonymous Love support requires newer MYSQL 5.6.3+. Scotchbox ships with 5.5.x.		
	if ( $author ) {
		$ip = '0.0.0.0';
	}
	else {
		$ip = $_SERVER['REMOTE_ADDR'];
	}
	
	return db_QueryInsert(
		"INSERT IGNORE INTO ".SH_TABLE_PREFIX.SH_TABLE_NOTE_LOVE." (
			note,
			author,
			ip,
			timestamp
		)
		VALUES ( 
			?,
			?,
			INET6_ATON(?),
			NOW()
		);",
		$note,
		$author,
		$ip
	);
}

/// Can only remove 1 love at a time
function noteLove_RemoveByNote( $note, $author ) {
	if ( is_array($note) ) {
		return null;
	}
	
	if ( !$note )
		return null;

	// Anonymous Love support requires newer MYSQL 5.6.3+. Scotchbox ships with 5.5.x.		
	if ( $author ) {
		$ip = '0.0.0.0';
	}
	else {
		$ip = $_SERVER['REMOTE_ADDR'];
	}
	
	return db_QueryDelete(
		"DELETE FROM ".SH_TABLE_PREFIX.SH_TABLE_NOTE_LOVE."
		WHERE note=? AND author=? AND ip=INET6_ATON(?);",
		$note,
		$author,
		$ip
	);
}

function noteLove_GetByAuthor( $author ) {
	if ( is_array($author) ) {
		return null;
	}

	if ( !$author )
		return null;
		
	// TODO: Limit to 500 loves?

	return db_QueryFetchSingle(
		"SELECT note
		FROM ".SH_TABLE_PREFIX.SH_TABLE_NOTE_LOVE."
		WHERE author=?;",
		$author
	);
	
	return null;
}

import React from 'react';
import Login from './Login';
import NewPost from './NewPost';
import Feed from './Feed';

export default (props) => {
	var data = props.data;
	// console.log(data);
	return (
		<div style={{
			width: '100%',
			textAlign: 'center'
		}}>
			<Feed/>
			<Login/>
			<NewPost/>
		</div>
	);
};

import React, {Component, useState} from 'react';
import { FormattedMessage } from 'react-intl';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { backendDomain, apolloPort } from '../index';
import {useGlobal} from "reactn";
import LinearProgress from "@material-ui/core/LinearProgress";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import Slide from "@material-ui/core/Slide";

const Transition = (props) => {
	return <Slide direction="down" {...props} />;
};

export default (props) => {
	const [loggedIn, setLoggedIn] = useGlobal('loggedIn');
	const [showForm, setShowForm] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [location, setLocation] = useState('');
	const [description, setDescription] = useState('');
	const [feedNeedsUpdate, setFeedNeedsUpdate] = useGlobal('feedNeedsUpdate');

	const handleChange = input => ({ target: { value } }) => {
		switch(input) {
			case 'location':
				setLocation(value);
				break;
			case 'description':
				setDescription(value);
				break;
			default:
		}
	};

	const submit = (e) => {
		e.preventDefault(); // Don't leave the page
		let xhr = new XMLHttpRequest();
		let url = `http://${backendDomain}:${apolloPort}/`;
		let inputElement = document.getElementById("select");
		let formData = new FormData();
		// Create a GraphQL file upload mutation using HTTP POST based on
		// https://github.com/jaydenseric/graphql-multipart-request-spec
		formData.append('operations', `{ "query": "mutation ($file: Upload!, $location: String, $description: String) { singleUpload(file: $file, location: $location, description: $description) }", "variables": { "file": null, "location": "${location}", "description": "${description}" } }`);
		formData.append('map', '{ "0": ["variables.file"] }');
		formData.append('0', inputElement.files[0]);

		xhr.onreadystatechange = (event) => {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				// TODO show all photos uploaded by user
				console.log(xhr.responseText);
				setShowForm(false);
				setIsUploading(false);
				setFeedNeedsUpdate(true);
			}
		};

		// Show a snackbar
		xhr.onerror = (event) => {
			setShowForm(false);
		};

		// Doesn't actually use Apollo just regular POST on the same port
		xhr.open('POST', url, true);
		xhr.setRequestHeader('authorization', localStorage.getItem('authToken'));
		xhr.send(formData);
	};

	const newPostForm = <Dialog
		open={showForm}
		TransitionComponent={Transition}
		keepMounted
		onClose={() => {}}
		aria-labelledby="alert-dialog-slide-title"
		aria-describedby="alert-dialog-slide-description"
	>
		{/* Show a linear progress bar when connecting */}
		{isUploading ? <LinearProgress /> : null}
		<DialogTitle id="alert-dialog-slide-title"
					 style={{paddingBottom: "0px"}}>
			{<FormattedMessage id="newPost" defaultMessage="New Post"/>}
		</DialogTitle>
		{/* No real use for both 'form' and 'input'
						except for saving passwords */}
		{/* action="#" needed so that the page won't refresh */}
		<form autoComplete="on" action="#">
			<DialogContent>
				<input type="submit" style={{ display: "none" }}/>
				<TextField fullWidth
						   autoFocus={true}
						   label={<FormattedMessage id="newPost.location"
													defaultMessage="Location"/>}
						   onKeyDown={() => {}}
						   onChange={handleChange('location')}
						   defaultValue={''}
						   error={false}
				/>
				<br/>
				<TextField fullWidth
						   autoFocus={true}
						   label={<FormattedMessage id="newPost.description"
													defaultMessage="Description"/>}
						   onKeyDown={() => {}}
						   onChange={handleChange('description')}
						   defaultValue={''}
						   error={false}
				/>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						setShowForm(false);
						setIsUploading(false);
					}} color="primary">
					<FormattedMessage id="cancel" defaultMessage="Cancel"/>
				</Button>
				<Button onClick={() => {
					// Keep showing the form while the file is being uploaded
					setShowForm(true);
					setIsUploading(true);
					document.getElementById("upload").click();
				}} color="primary" type='submit'>
					<FormattedMessage id="newPost.post" defaultMessage="Post" />
				</Button>
			</DialogActions>
		</form>
	</Dialog>;

	// Only show the button if a user logged in
	return !loggedIn ? <div></div> : (
		<div>
			{/* Shown once user selects a file to upload */}
			{newPostForm}
			<form id="fileuploadform" onSubmit={submit} style={{
				top: 'auto',
				right: 20,
				bottom: 20,
				left: 'auto',
				position: 'fixed'
			}}>
				<input id="select" type="file" name="videoUpload" onChange={() => {
					setShowForm(true);
				}} style={{
					display: 'none'
				}}/>
				<label htmlFor="select">
					<Fab color="primary" size="large" variant="extended" aria-label="Add" onClick={() => {
						// Click on the hidden ugly input button
						document.getElementById("select").click();
					}} style={{
						margin: '10px'
					}}>
						<AddIcon/>
						<FormattedMessage id="newPost" defaultMessage="New Post"/>
					</Fab>
				</label>
				<input id="upload" type="submit" value="" style={{
					display: 'none'
				}}/>
			</form>
		</div>
	);
};

import React, { useState, createRef } from 'react';
import { useGlobal } from 'reactn';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@material-ui/core/Link';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Slide from '@material-ui/core/Slide';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import LinearProgress from '@material-ui/core/LinearProgress';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag';
import { apolloClient } from '../index';

const SIGNUP_MUTATION = gql`
	mutation SignupMutation($email: String!, $name: String!, $password: String!) {
		signup(email: $email, name: $name, password: $password)
	}
`;
const LOGIN_MUTATION = gql`
	mutation LoginMutation($email: String!, $password: String!) {
		login(email: $email, password: $password)
	}
`;

const Transition = (props) => {
	return <Slide direction="up" {...props} />;
};

export default (props) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [emailValid, setEmailValid] = useState(true);
	const [emailInUse, setEmailInUse] = useState(false);
	const [passwordValid, setPasswordValid] = useState(true);
	const [userHitEnter, setUserHitEnter] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [connectionFailed, setConnectionFailed] = useState(false);
	const [badCredentials, setBadCredentials] = useState(false);
	const [gqlError, setGQLError] = useState(false);
	const [loggedIn, setLoggedIn] = useGlobal('loggedIn');
	const [showLoginDialog, setShowLoginDialog] = useGlobal('showLoginDialog');

	// Save TextField input in React State on every keypress
	const handleChange = input => ({ target: { value } }) => {
        // Do NOT validate email and password on every keypress
		switch(input) {
			case 'email':
				// Saved email (no manual user input)
				setEmail(value);
				break;
			case 'password':
				// Saved password (no manual user input)
				setPassword(value);
				break;
			default:
		}
	};

	const handleClose = () => {
		// Hide linear progress bar and all Snackbars
		setShowLoginDialog(false); // GLOBAL STATE
		setIsConnecting(false);
		setConnectionFailed(false);
		setEmailInUse(false);
		setEmailValid(true);
		setPasswordValid(true);
		setBadCredentials(false);
		setGQLError(false);
	};

	// Close the Dialog by default (password
	// parameter false if TextField(s) is/are invalid)
	const updateTextFieldState = (closeDialog = true) => {
		setShowLoginDialog((!closeDialog && isEmailValid(email) && isPasswordValid(password))); // GLOBAL STATE
		setEmailValid(isEmailValid(email));
		setPasswordValid(isPasswordValid(password));
	};

	const handleKeyPress = (e) => {
		if (e.keyCode === 13) { // Enter/Return key
			// Highlight invalid TextFields in red but don't close the Dialog
			updateTextFieldState(false);
			setUserHitEnter(true);
			logIn();
		} else {
			setUserHitEnter(false);
		}
	};

	const isEmailValid = (email) => {
		return email.length !== 0 && email.includes('@') && email.includes('.');
	};

	const isPasswordValid = (password) => {
		return password.length >= 8;
	};

	const logIn = async () => {
		// Hide the "Connection failed" Snackbar if shown
		setConnectionFailed(false);
		if (isEmailValid(email) && isPasswordValid(password)) {
			// Show linear progress bar while logging in
			setIsConnecting(true);
			apolloClient.mutate({
				variables: {
					email: email,
					password: password
				},
				mutation: LOGIN_MUTATION,
			})
			.then(result => {
				// User email / password not found or incorrect
				if (result.data.login.toString().includes('bad credentials')) {
					setBadCredentials(true);
					setIsConnecting(false);
					setEmailValid(false);
					setPasswordValid(false);
				} else { // Login successful
					const responseStr = result.data.login.toString();
					if (responseStr.includes('authToken: ')) {
						// Save token in localStorage (XSS vulnerable unlike Cookie (CSRF))
						localStorage.setItem('authToken',
							responseStr.substring(11)); // Skip 'authToken: '
					}
					// Run updateTextFieldState() once more to close
					// the Dialog after successful login
					updateTextFieldState();
					// Hide linear progress bar and all Snackbars
					setEmailInUse(false);
					setConnectionFailed(false);
					setGQLError(false);
					setBadCredentials(false);
					setIsConnecting(false);
					setLoggedIn(true); // GLOBAL STATE
					// window.location.reload();
				}
			}).catch(error => {
				setLoggedIn(false); // GLOBAL STATE
				setIsConnecting(false); // Hide linear progress bar
				if (error.toString().includes('Network error: ' +
						'NetworkError when attempting to fetch resource.')) {
					setConnectionFailed(true);
				} else {
					console.log(`GraphQL Login Mutation Error: ${error}`);
					setGQLError(true);
				}
			});
		} else {
			// Update UI to highlight invalid fields in red
			updateTextFieldState();
		}
	};

	const signUp = async () => {
		if (isEmailValid(email) && isPasswordValid(password)) {
			// Show linear progress bar while signing up
			setIsConnecting(true);
			apolloClient.mutate({
				variables: {
					email: email,
					name: email.split('@')[0],
					password: password
				},
				mutation: SIGNUP_MUTATION,
			})
			.then(result => {
				console.log(result);
				// Show Snackbar when account already exists
				const responseStr = result.data.signup.toString();
				if (responseStr.includes('email in use')) {
					setLoggedIn(false); // GLOBAL STATE
					setEmailInUse(true);
					updateTextFieldState(false); // Close the Dialog after signup
				} else if (responseStr.includes('authToken: ')) {
					// Save token in localStorage (XSS vulnerable unlike Cookie (CSRF))
					localStorage.setItem('authToken',
						responseStr.substring(11)); // Skip 'authToken: '
					setLoggedIn(true); // GLOBAL STATE
					updateTextFieldState(true); // Close the Dialog after signup
				}
				// Hide linear progress bar and 'Please Wait...' Snackbar
				setConnectionFailed(false);
				setGQLError(false);
				setBadCredentials(false);
				setIsConnecting(false);
			})
			.catch(error => {
				console.log(`GraphQL Signup Mutation Error: ${error}`);
				// Hide linear progress bar and 'Please Wait...' Snackbar
				setConnectionFailed(true);
				setGQLError(false);
				setBadCredentials(false);
				setIsConnecting(false);
				setLoggedIn(false); // GLOBAL STATE
			});
		} else {
			// Update UI to highlight invalid fields in red
			updateTextFieldState();
		}
	};

	const passwordRef = createRef();
	return (
		<div>
			<Dialog
				open={showLoginDialog}
				TransitionComponent={Transition}
				keepMounted
				onClose={handleClose}
				aria-labelledby="alert-dialog-slide-title"
				aria-describedby="alert-dialog-slide-description"
				>
				{/* Show a linear progress bar when connecting */}
				{isConnecting ? <LinearProgress /> : null}
				<DialogTitle id="alert-dialog-slide-title"
					style={{paddingBottom: "0px"}}>
					{<FormattedMessage id="login" defaultMessage="Log In"/>}
				</DialogTitle>
				{/* No real use for both 'form' and 'input'
						except for saving passwords */}
				{/* action="#" needed so that the page won't refresh */}
				<form autoComplete="on" action="#">
					<DialogContent>
						<input type="submit" style={{ display: "none" }}/>
						<TextField fullWidth
							autoFocus={true}
							label={<FormattedMessage id="login.email"
								defaultMessage="E-mail"/>}
							onKeyDown={handleKeyPress}
							onChange={handleChange('email')}
							defaultValue={''}
							error={!emailValid}
						/>
						<br/>
						<TextField fullWidth
							ref={passwordRef}
							id="standard-password-input"
							label={
								<FormattedMessage id="login.password"
									defaultMessage="password"/>
							}
							onKeyDown={handleKeyPress}
							onChange={handleChange('password')}
							className={''}
							type="password"
							autoComplete="current-password"
							margin="normal"
							error={!passwordValid}
						/>
						<br/><br/>
						<Link component={RouterLink} type='submit' to="/"
							onClick={ () => {} }>
							<FormattedMessage id="login.resetPassword"
								defaultMessage="Reset password" />
						</Link>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={handleClose} color="primary">
							<FormattedMessage id="cancel" defaultMessage="Cancel"/>
						</Button>
						<Button onClick={signUp} color="primary" type='submit'>
							<FormattedMessage id="login.signup" defaultMessage="Sign Up" />
						</Button>
						<Button type='submit'
							onClick={logIn}
							// Highligh this Button when
							// user hits Enter instead of clicking on it
							color={userHitEnter ? 'secondary' : 'primary'}
							variant={userHitEnter ? 'contained' : 'text'}
							>
							<FormattedMessage id="login" defaultMessage="Log In"/>
						</Button>
					</DialogActions>
				</form>
			</Dialog>
			{/* Error messages (Snackbars) */}
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				open={!emailValid}
				autoHideDuration={6000}
				onClose={() => {}}
				ContentProps={{
					'aria-describedby': 'message-id',
				}}
				message={
					<FormattedMessage
						id="login.invalidEmailSnackbar"
						defaultMessage="Please enter a valid email address."/>
				}
			/>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				open={!passwordValid}
				autoHideDuration={6000}
				onClose={() => {}}
				ContentProps={{
					'aria-describedby': 'message-id',
				}}
				message={
					<FormattedMessage
						id="login.invalidpasswordSnackbar"
						defaultMessage=
						"Please enter a valid (at least than 8 characters) password."/>
				}
			/>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				open={isConnecting}
				autoHideDuration={6000}
				onClose={() => {}}
				ContentProps={{
					'aria-describedby': 'message-id',
				}}
				message={
					<FormattedMessage
						id="wait"
						defaultMessage="Please wait..."/>
				}
			/>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				open={connectionFailed}
				autoHideDuration={6000}
				onClose={() => {}}
				ContentProps={{
					'aria-describedby': 'message-id',
				}}
				message={
					<FormattedMessage
						id="connectionFailed"
						defaultMessage="Connection failed. Please try again later."/>
				}
				action={[
					<IconButton
						key="close"
						aria-label="Close"
						color="inherit"
						className="invalidEmailSnackbarCloseButton"
						// Doesn't make the connection successful but hides the snackbar
						onClick={() => {setConnectionFailed(false)}}
					>
						<CloseIcon />
					</IconButton>,
				]}
			/>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				open={emailInUse}
				autoHideDuration={6000}
				onClose={() => {}}
				ContentProps={{
					'aria-describedby': 'message-id',
				}}
				message={
					<FormattedMessage
						id="login.emailInUseSnackbar"
						defaultMessage="An account with this email already exists. \
							Try resetting your password."/>
				}
				action={[
					<IconButton
						key="close"
						aria-label="Close"
						color="inherit"
						className="emailInUseSnackbarCloseButton"
						// Doesn't make the connection successful but hides the snackbar
						onClick={() => {setEmailInUse(false)}}
					>
						<CloseIcon />
					</IconButton>,
				]}
			/>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				open={badCredentials}
				autoHideDuration={6000}
				onClose={() => {}}
				ContentProps={{
					'aria-describedby': 'message-id',
				}}
				message={
					<FormattedMessage
						id="login.badCredentialsSnackbar"
						defaultMessage="Incorrect email and/or password. \
							Please try again."/>
				}
			/>
			<Snackbar
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				open={gqlError}
				autoHideDuration={6000}
				onClose={() => {}}
				ContentProps={{
					'aria-describedby': 'message-id',
				}}
				message={
					<FormattedMessage
						id="unknownError"
						defaultMessage="Unknown error."/>
				}
				action={[
					<IconButton
						key="close"
						aria-label="Close"
						color="inherit"
						className="unknownErrorSnackbarCloseButton"
						// Doesn't make the connection successful but hides the snackbar
						onClick={() => {setGQLError(false)}}
					>
						<CloseIcon />
					</IconButton>
				]}
			/>
		</div>
	);
};

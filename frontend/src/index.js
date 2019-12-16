import React from 'react';
import ReactDOM from 'react-dom';
import { setGlobal } from 'reactn';
import * as serviceWorker from './serviceWorker';
import { ApolloClient } from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { createUploadLink } from 'apollo-link-upload';
import { onError } from "apollo-link-error";
import { InMemoryCache } from 'apollo-cache-inmemory';
import { BrowserRouter } from 'react-router-dom';
import { setContext } from 'apollo-link-context';
import { IntlProvider, addLocaleData } from 'react-intl';
import en from "react-intl/locale-data/en";
import zh from "react-intl/locale-data/zh";
import hi from "react-intl/locale-data/hi";
import es from "react-intl/locale-data/es";
import ar from "react-intl/locale-data/ar";
import ms from "react-intl/locale-data/ms";
import ru from "react-intl/locale-data/ru";
import bn from "react-intl/locale-data/bn";
import messages from "./messages";
import App from './App';
import './index.css';
export const backendDomain = 'localhost';
// WARNING: UPGRADE TO wss:// & https:// ONCE IN PRODUCTION
const hyperTextProtocol = 'http://';
const webSocketsProtocol = 'ws://';
const webSocketsPort = 5001;
export const apolloPort = 4000;
const apolloURL = "/";
const supportedLocales = ['en', 'zh', 'hi', 'es', 'ar', 'ms', 'ru', 'bn'];
const autoDetectLocale = true;
var currentLocale = 'en';

handleLocalization(autoDetectLocale);

if (webSocketsProtocol === 'ws://') {
	console.log('%c WARNING: Using unsecure ws:// protocol, consider using wss:// instead', 'color: red;');
}
var socket = new WebSocket(webSocketsProtocol + backendDomain + ':' + webSocketsPort + '/', 'protocolOne');
// So that other components can communicate with backend using WebSockets
export { socket };
// In case you want to bypass GraphQL and use WebSockets directly from ANOTHER FILE
// import { socket } from './../index.js'; socket.send('string');

// APOLLO LINKS:
// Error Link (for GraphQL debugging purposes)
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );
  if (networkError) console.log(`[Network error]: ${networkError}`);
});
// I
// M
// P
// O
// R
// T
// A
// N
// T
// THIS IS CLIENT SIDE ONLY CONTEXT
// CHANGING THIS WITHOUT UPDATING SERVER SIDE CONTEXT WILL BREAK THINGS
// Add authToken to HTTP headers
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
	console.log("TOKEN: " + localStorage.getItem('authToken'));
  const token = localStorage.getItem('authToken');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? token : "NONE",
    }
  }
});
// httpLink was replaced by uploadLink
const uploadLink = new createUploadLink({ uri: hyperTextProtocol + backendDomain + ':'
	+ apolloPort + apolloURL });
// Don't use httplink and uploadlink together
const compositeLink = errorLink.concat(authLink).concat(uploadLink);
export const apolloClient = new ApolloClient({
	// Concatenate authToken to httpLink
	link: compositeLink,
	cache: new InMemoryCache()
});

// GLOBAL STATE
setGlobal({
	loggedIn: !!localStorage.getItem('authToken'),
	showLoginDialog: false,
	feedNeedsUpdate: false,
	searchQuery: ''
});

// Render App
ReactDOM.render((
  	<BrowserRouter>
		<ApolloProvider client={apolloClient}>
			<IntlProvider
				locale={currentLocale}
				messages={messages[currentLocale]}
				>
				<App />
			</IntlProvider>
		</ApolloProvider>
	</BrowserRouter>
), document.getElementById('root'));

function handleLocalization(autodetect=true) {
	// Auto-detect locale from browser
	if (autodetect === true) {
		var userLang = navigator.language || navigator.userLanguage;
		for (let locale of supportedLocales) {
			if (userLang.substring(0, 2) === locale) {
				currentLocale = locale;
			}
		}
	}
	addLocaleData(en);
	addLocaleData(zh);
	addLocaleData(hi);
	addLocaleData(es);
	addLocaleData(ar);
	addLocaleData(ms);
	addLocaleData(ru);
	addLocaleData(bn);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();

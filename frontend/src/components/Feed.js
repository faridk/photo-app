import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import Post from './Post';
import {useGlobal} from "reactn";

const FEED_QUERY = searchQuery => gql`
    {
        feed${searchQuery ? `(search: "${searchQuery}")` : ``} {
            id
            user {
                email
            }
            location
            description
            image {
                filename
            }
            time
            comments {
                text
                time
            }
        }
    }
`;

export default (props) => {
    const [feedNeedsUpdate, setFeedNeedsUpdate] = useGlobal('feedNeedsUpdate');
    const [searchQuery, setSearchQuery] = useGlobal('searchQuery');
    console.log("feed (re)rendered");
    return (
        <div style={{
            display: 'inline-block'
        }}>
            <Query fetchPolicy="no-cache" query={FEED_QUERY(searchQuery)}>
                {/* Doesn't matter whether it's true/false as long as it changes */}
                {({ loading, error, data, refetch }) => {
                    if (loading) return "Loading...";
                    if (error) return `Error! ${error.message}`;
                    if (feedNeedsUpdate) {
                        console.log("FEED NEEDS UPDATE");
                        refetch();
                        setFeedNeedsUpdate(false);
                    }
                    if (data.feed.length === 0) {
                        return <h1>NO POSTS YET</h1>
                    }
                    return (
                        data.feed.map(post => (
                            <Post id={post.id} user={post.user} location={post.location}
                                  description={post.description} filename={post.image.filename}
                                  comments={post.comments} time={post.time}/>
                        ))
                    );
                }}
            </Query>
        </div>
    );
};

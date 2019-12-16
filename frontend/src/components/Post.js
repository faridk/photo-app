import React, { useRef, useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';
import TextField from "@material-ui/core/TextField";
import gql from 'graphql-tag';
import {apolloClient} from "../index";

const useStyles = makeStyles({
    card: {
        minWidth: 640,
        maxWidth: '90%',
        margin: 15
    },
    media: {
        height: 0,
        paddingTop: '56.25%', // 16:9
        marginTop: '1'
    },
    expand: {
        transform: 'rotate(0deg)',
        marginLeft: 'auto'
    },
    expandOpen: {
        transform: 'rotate(180deg)',
    },
    avatar: {
        backgroundColor: red[500],
    }
});

const NEW_COMMENT_MUTATION = gql`
	mutation NewCommentMutation($comment: String!, $postID: ID!) {
		newComment(comment: $comment, postID: $postID)
	}
`;

export default (props) => {
    let commentInput = useRef(null);
    const classes = useStyles();
    const [expanded, setExpanded] = useState(false);
    const [userComment, setUserComment] = useState('');

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    const handleChange = (e) => {
        setUserComment(e.target.value);
    };

    const handleKeyPress = (e) => {
        // Enter/Return key
        if (e.keyCode === 13 && userComment.length !== 0) {
            sendComment();
            window.location.reload();
            // e.preventDefault();
        }
    };

    const sendComment = () => {
        apolloClient.mutate({
            variables: {
                comment: userComment,
                postID: props.id
            },
            mutation: NEW_COMMENT_MUTATION,
        }).then(result => {
            // If changed here must be changed on server
            if (result.data.newComment === "not logged in") {
                // TODO snackbar
                alert("Only logged in users can post comments! Click in the top right corner to log in.");
            } else {
                commentInput.current.value = "";
            }
        }).catch(error => {
            if (error.toString().includes('Network error: ' +
                'NetworkError when attempting to fetch resource.')) {
            } else {
                console.log(`GraphQL Login Mutation Error: ${error}`);
            }
        });
    };

    return (
        <Card className={classes.card}>
            <CardHeader
                avatar={
                    <Avatar aria-label="image" className={classes.avatar}>
                        {props.user.email.length > 0 ? props.user.email.charAt(0).toUpperCase() : '@'}
                    </Avatar>
                }
                action={
                    <IconButton aria-label="settings">
                        <MoreVertIcon />
                    </IconButton>
                }
                title={props.user.email}
                subheader={props.location.length === 0 ? '' : "Location: " + props.location}
            />
            <CardMedia
                className={classes.media}
                image={"/" + props.filename}
                title="Image"
            />
            <CardContent>
                <Typography variant="body2" color="textSecondary" component="p">
                    Created on: {props.time}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                    {props.description.length === 0 ? '' : "Description: " + props.description}
                </Typography>
            </CardContent>
            <CardActions disableSpacing>
                {/*<IconButton aria-label="add to favorites">*/}
                {/*    <FavoriteIcon />*/}
                {/*</IconButton>*/}
                <IconButton aria-label="share"
                            onClick={handleExpandClick}>
                    <CommentIcon />
                </IconButton>
                <IconButton
                    className={clsx(classes.expand, {
                        [classes.expandOpen]: expanded,
                    })}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                    <ExpandMoreIcon />
                </IconButton>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Typography paragraph>
                        Comments
                    </Typography>
                    <form className={classes.root} noValidate autoComplete="off">
                        <TextField id="leave-a-comment"
                                   label="Leave a comment"
                                   onKeyDown={handleKeyPress}
                                   onChange={handleChange}
                                   inputRef={commentInput}/>
                    </form>
                    {props.comments.map(comment => (
                        <Typography paragraph>
                            {comment.text} - time {comment.time}
                        </Typography>
                    ))}
                </CardContent>
            </Collapse>
        </Card>
    );
};

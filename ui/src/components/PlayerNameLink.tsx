import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import theme from '../theme';

export interface PlayerNameLinkProps {
  playerName: string;
  playerId: string;
  light?: boolean;
}

const usePlayerNameLinkStyles = makeStyles({
  link: {
    cursor: 'pointer',
    color: theme.palette.typography.link,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  linkLight: {
    cursor: 'pointer',
    color: '#adf',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});

const PlayerNameLink = (props: PlayerNameLinkProps) => {
  const classes = usePlayerNameLinkStyles();
  let url = `https://aoe2.net/#profile-${props.playerId}`;
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      title={`aoe2.net: ${props.playerName}`}
      className={props.light ? classes.linkLight : classes.link}
      href={url}
    >
      {props.playerName}
    </a>
  );
};

export default PlayerNameLink;

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
    color: '#ddd',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});

const PlayerNameLink = (props: PlayerNameLinkProps) => {
  const classes = usePlayerNameLinkStyles();
  return (
    <span
      title="aoe2.net link"
      className={props.light ? classes.linkLight : classes.link}
      onClick={() => {
        window.open(`https://aoe2.net/#profile-${props.playerId}`);
      }}
    >
      {props.playerName}
    </span>
  );
};

export default PlayerNameLink;

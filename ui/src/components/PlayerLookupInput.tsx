import React from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { makeStyles, withStyles } from '@material-ui/core/styles';

import Button from '../elements/Button';
import TextInput from '../elements/TextInput';

const StyledFormLabel = withStyles(() => ({
  root: {
    color: 'black',
    '&.Mui-focused': {
      color: 'black',
    },
  },
}))(FormLabel);

const useStyles = makeStyles(() => {
  return {
    root: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '550px',
      padding: '10px',
      background: 'rgba(0, 0, 0, 0.1)',
      boxShadow: '0px 0px 5px 4px rgba(0, 0, 0, 0.1)',
    },
  };
});

interface PlayerLookupInputProps {
  onSubmit: (playerName: string, leaderboardName: string) => void;
  isLoading: boolean;
  defaultName?: string;
  defaultLeaderboardName?: string;
}

const PlayerLookupInput = (props: PlayerLookupInputProps) => {
  const [playerName, setPlayerName] = React.useState(props.defaultName || '');

  const [leaderboardName, setLeaderboardName] = React.useState(
    props.defaultLeaderboardName || 'solo'
  );
  const classes = useStyles();

  const handleLeaderboardNameClick = (ev: React.SyntheticEvent) => {
    setLeaderboardName((ev.target as HTMLInputElement).value);
  };

  return (
    <div className={classes.root}>
      <TextInput
        value={playerName}
        onChange={ev => {
          setPlayerName((ev?.target as HTMLInputElement).value);
        }}
        onKeyDown={ev => {
          if (
            (ev as any).which === 13 &&
            !(props.isLoading || playerName.length < 3)
          ) {
            props.onSubmit(playerName.trim(), leaderboardName);
          }
        }}
      />
      <div>
        <FormControl component="fieldset">
          <StyledFormLabel>Leaderboard</StyledFormLabel>
          <RadioGroup
            aria-label="leaderboard"
            name="leaderboard1"
            value={leaderboardName}
            onChange={handleLeaderboardNameClick}
          >
            <FormControlLabel value="solo" control={<Radio />} label="Solo" />
            <FormControlLabel value="team" control={<Radio />} label="Team" />
          </RadioGroup>
        </FormControl>
      </div>
      <Button
        type="primary"
        disabled={props.isLoading || playerName.length < 3}
        onClick={() => {
          props.onSubmit(playerName, leaderboardName);
        }}
      >
        Search
      </Button>
    </div>
  );
};

export default PlayerLookupInput;

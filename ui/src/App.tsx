import React from 'react';
import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
} from '@material-ui/core/styles';
import theme, { ColorBackground } from './theme';
import PlayerRecordsTable from './components/PlayerRecordsTable';
import PlayerLookupInput from './components/PlayerLookupInput';
import PlayerInfo from './components/PlayerInfo';
import CurrentGameInfo, {
  gameResponseToProps,
} from './components/CurrentGameInfo';
import { useGet } from './hooks/axiosHooks';

const MUITheme = createMuiTheme(theme);

const useAppStyles = makeStyles(theme => {
  return {
    app: {
      textAlign: 'center',
      position: 'relative',
    },
    appHeader: {
      fontSize: '1.5rem',
      color: 'black',
      display: 'flex',
      justifyContent: 'center',
      position: 'fixed',
      top: '0px',
      width: '100%',
      background: ColorBackground,
    },
    headerSize: {
      position: 'relative',
      height: '50px',
      width: '1200px',
      display: 'flex',
      justifyContent: 'space-between',
    },
    headerLeft: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      height: '100%',
      color: 'white',
      padding: '0px 10px',
      background: 'rgba(0, 0, 0, 0.1)',
      boxShadow: '0px -4px 5px 4px rgba(0, 0, 0, 0.1)',
    },
    headerRight: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      height: '100%',
    },
    headerIcon: {
      width: '24px',
      cursor: 'pointer',
      marginLeft: '10px',
      borderRadius: '24px',
      background: 'rgba(0, 0, 0, 0.1)',
      boxShadow: '0px 0px 5px 4px rgba(0, 0, 0, 0.1)',
      transition: 'background 0.5s, box-shadow 0.5s',
      '&:hover': {
        background: 'rgba(0, 0, 0, 0.3)',
        boxShadow: '0px 0px 5px 4px rgba(0, 0, 0, 0.3)',
      }
    },
    pageContent: {
      marginTop: '50px',
    },
    backgroundImageContainer: {
      display: 'flex',
      justifyContent: 'center',
    },
    backgroundImage: {
      position: 'fixed',
      zIndex: -1,
      opacity: 0.25,
      [theme.breakpoints.up('xl')]: {
        width: '3072px',
      },
    },
    playerNameInputContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem',
    },
    currentGameContainer: {
      marginTop: '2rem',
      display: 'flex',
      justifyContent: 'center',
    },
    infoContainer: {
      marginTop: '2rem',
    },
    tableContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem',
    },
    tableSize: {
      width: '1200px',
      marginBottom: '5rem',
    },
    errorText: {
      color: theme.palette.error.main,
    },
    appFooter: {
      position: 'absolute',
      bottom: 0,
      margin: '2rem',
      width: 'calc(100% - 4rem)',
    },
  };
});

const App = (): JSX.Element => {
  const classes = useAppStyles();

  const defaultPlayerName =
    window.location.hash.slice(1).split(',')[0].slice(0, 25) || '';
  let defaultLeaderboardName = window.location.hash.slice(1).split(',')[1];
  if (defaultLeaderboardName !== 'solo' && defaultLeaderboardName !== 'team') {
    defaultLeaderboardName = '';
  }

  const [playerNameQuery, setPlayerNameQuery] = React.useState(
    defaultPlayerName
  );
  const [leaderboardNameQuery, setLeaderboardNameQuery] = React.useState(
    defaultLeaderboardName
  );

  const [response, loading, error] = useGet(
    playerNameQuery ? `lookup/${playerNameQuery}/${leaderboardNameQuery}` : ''
  );

  return (
    <ThemeProvider theme={MUITheme}>
      <div className={classes.app}>
        <div className={classes.pageContent}>
          <div className={classes.backgroundImageContainer}>
            <img
              src="/static/background.jpg"
              className={classes.backgroundImage}
              alt="bg"
            />
          </div>
          <div className={classes.playerNameInputContainer}>
            <PlayerLookupInput
              isLoading={loading}
              onSubmit={(playerName, leaderboardName) => {
                setPlayerNameQuery(playerName);
                setLeaderboardNameQuery(leaderboardName);
                window.location.hash = `${playerName},${leaderboardName}`;
              }}
              defaultName={defaultPlayerName}
              defaultLeaderboardName={defaultLeaderboardName}
            />
          </div>
          <div className={classes.currentGameContainer}>
            {!loading && response?.data.most_recent_game ? (
              <CurrentGameInfo
                {...gameResponseToProps(
                  response?.data.profile_id,
                  response?.data.most_recent_game
                )}
              />
            ) : null}
          </div>
          <div className={classes.infoContainer}>
            {!loading ? (
              <PlayerInfo
                playerName={response?.data.player_name}
                playerId={response?.data.profile_id}
                leaderboardName={leaderboardNameQuery}
                numRecords={
                  Object.keys(response?.data.tracker.records || {}).length
                }
              />
            ) : null}
          </div>
          <div className={classes.tableContainer}>
            <div className={classes.tableSize}>
              {playerNameQuery ? (
                <PlayerRecordsTable
                  loading={loading}
                  error={error}
                  data={response?.data}
                />
              ) : null}
            </div>
          </div>
          <header className={classes.appHeader}>
            <div className={classes.headerSize}>
              <div className={classes.headerLeft}>
                AOE2: DE Head2Head - Matchup Tracker
              </div>
              <div className={classes.headerRight}>
                <img
                  src="static/aoe2net.png"
                  alt="aoe2net"
                  title="aoe2.net"
                  className={classes.headerIcon}
                  onClick={() => {
                    window.open('https://aoe2.net/');
                  }}
                ></img>
                <img
                  src="static/github.png"
                  alt="github"
                  title="github"
                  className={classes.headerIcon}
                  onClick={() => {
                    window.open(
                      'https://github.com/benjamin-t-brown/aoe2de_head2head'
                    );
                  }}
                ></img>
              </div>
            </div>
          </header>
          <footer className={classes.appFooter}>
            This site is not affiliated with or endorsed by Microsoft
            Corporation. Age of Empires II: Definitive Edition is a trademark or
            registered trademark of Microsoft Corporation in the U.S. and other
            countries.
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;

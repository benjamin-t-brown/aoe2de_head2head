import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Pagination from '@material-ui/lab/Pagination';
import CircularProgress from '@material-ui/core/CircularProgress';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import SearchIcon from '@material-ui/icons/Search';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import {
  LookupQueryResult,
  LookupQueryRecordResult,
  LookupQueryPlayerResult,
} from '../hooks/axiosHooks';
import theme from '../theme';
import PlayerNameLink from './PlayerNameLink';
import TextField from '@material-ui/core/TextField';

const SORT_DIR_ASC = 'asc';
const SORT_DIR_DSC = 'dsc';

const DARK_MODE_LS_KEY = 'aoe2de-player-tracker-dark-mode';

const StyledTableCell = withStyles({
  head: {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
  },
  body: {
    fontSize: 14,
    color: (props: any) => {
      return props.isDarkMode ? 'white' : 'black';
    },
  },
})((props: any) => {
  const spreadProps = {
    ...props,
  };
  delete spreadProps.isDarkMode;
  return <TableCell {...spreadProps} />;
});

const StyledTableRow = withStyles({
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: (props: any) => {
        return props.isDarkMode ? '#480a08' : '#fafafa';
      },
    },
    '&:nth-of-type(even)': {
      backgroundColor: (props: any) => {
        return props.isDarkMode ? '#491c09' : '#fff';
      },
    },
  },
})((props: any) => {
  const spreadProps = {
    ...props,
  };
  delete spreadProps.isDarkMode;
  return <TableRow {...spreadProps} />;
});

const StyledTextField = withStyles({
  root: {
    '& label': {
      color: '#BEBEBE',
    },
    '&:hover': {
      borderBottomColor: 'white',
    },
    '& input': {
      color: 'white',
    },
    '& label.Mui-focused': {
      color: '#EFEFEF',
    },
    '& .MuiInput-underline:hover': {
      borderBottomColor: 'white',
    },
    '& .MuiInput-underline:before': {
      borderBottomColor: 'white',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: 'white',
    },
  },
})(TextField);

const SortDirectionIcon = ({ sortDirection }: { sortDirection: string }) => {
  const style = {
    height: '16px',
    position: 'relative',
    top: '2px',
  } as any;
  return sortDirection === SORT_DIR_DSC ? (
    <ArrowDownward style={style} />
  ) : (
    <ArrowUpward style={style} />
  );
};

const useStyles = makeStyles({
  table: {
    minWidth: 700,
  },
  tableHeadCell: {
    cursor: 'pointer',
    '&:hover': {
      filter: 'brightness(120%)',
    },
  },
  error: {
    color: theme.palette.status.danger,
    background: theme.palette.secondary.main,
    padding: '1rem',
  },
  playerNameCell: {
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: '16px',
    position: 'relative',
    top: '3px',
    marginRight: '5px',
  },
  preHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  leftPreHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative',
    top: '18px',
  },
  filterName: {
    position: 'relative',
    padding: '5px',
    borderRadius: '5px',
    marginBottom: '2px',
    background: theme.palette.primary.main,
  },
  darkMode: {
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'flex-end',
  },
  pagination: {
    marginBottom: '5px',
    marginRight: '5px',
    position: 'relative',
    top: '-5px',
  },
});

interface PlayerRecordsTableProps {
  data?: LookupQueryResult;
  loading?: boolean;
  error?: boolean;
  leaderboardName: string;
}

const sortAndPaginate = (
  records: { [profile_id: string]: LookupQueryRecordResult },
  players: { [profile_id: string]: LookupQueryPlayerResult },
  sortColumn: string,
  sortDirection: 'dsc' | 'asc',
  pageIndex: number,
  maxRowsPerPage: number,
  nameFilter: string
): string[] => {
  return Object.keys(records)
    .filter(profileId => {
      if (nameFilter) {
        const player = players[profileId];
        return player.name.toLowerCase().includes(nameFilter.toLowerCase());
      } else {
        return true;
      }
    })
    .sort((a, b) => {
      const playerA = players[a];
      const recordA = records[a];

      const playerB = players[b];
      const recordB = records[b];

      let columnA = recordA[sortColumn];
      let columnB = recordB[sortColumn];

      if (sortColumn === 'name') {
        columnA = playerA.name.toLowerCase();
        columnB = playerB.name.toLowerCase();
      } else if (sortColumn === 'num_games') {
        columnA = recordA.wins_against + recordA.losses_to;
        columnB = recordB.wins_against + recordB.losses_to;
      }
      if (sortColumn === 'rating') {
        columnA = playerA.rating;
        columnB = playerB.rating;
      }

      if (sortDirection === SORT_DIR_ASC) {
        return columnA < columnB ? -1 : 1;
      } else if (sortDirection === SORT_DIR_DSC) {
        return columnA < columnB ? 1 : -1;
      } else {
        return 0;
      }
    })
    .slice(
      pageIndex * maxRowsPerPage,
      pageIndex * maxRowsPerPage + maxRowsPerPage
    );
};

const PlayerRecordsTable = (props: PlayerRecordsTableProps) => {
  const [sortColumn, setSortColumn] = React.useState('last_played_against');
  const [sortDirection, setSortDirection] = React.useState(
    SORT_DIR_DSC as 'asc' | 'dsc'
  );
  const [nameFilter, setNameFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [isDarkMode, setIsDarkMode] = React.useState(
    localStorage.getItem(DARK_MODE_LS_KEY) === 'true'
  );
  const maxRowsPerPage = 75;
  const classes = useStyles(props);

  const handleTableHeaderClick = (nextSortColumn: string) => {
    if (nextSortColumn === sortColumn) {
      setSortDirection(
        sortDirection === SORT_DIR_ASC ? SORT_DIR_DSC : SORT_DIR_ASC
      );
    } else {
      if (nextSortColumn === 'name') {
        setSortDirection(SORT_DIR_ASC);
      } else {
        setSortDirection(SORT_DIR_DSC);
      }
      setSortColumn(nextSortColumn);
    }
  };

  if (props.loading) {
    return <CircularProgress />;
  }

  if (props.error || !props.data) {
    return (
      <div className={classes.error}>
        No player exists with searched name on the given leaderboard.
      </div>
    );
  }

  const data = props.data as LookupQueryResult;
  (window as any).data = data;

  const numberOfPages = Math.ceil(
    Object.keys(data.tracker.records).length / maxRowsPerPage
  );

  const profileIds = sortAndPaginate(
    data.tracker.records,
    data.tracker.players,
    sortColumn,
    sortDirection,
    pageIndex,
    maxRowsPerPage,
    nameFilter
  );

  return (
    <div>
      <div className={classes.preHeader}>
        <div className={classes.leftPreHeader}>
          {numberOfPages > 1 ? (
            <Pagination
              className={classes.pagination}
              count={numberOfPages}
              page={pageIndex + 1}
              onChange={(_, page) => {
                setPageIndex(page - 1);
              }}
              shape="rounded"
            />
          ) : null}
          <span className={classes.darkMode}>
            <label htmlFor="dark-mode">Use Dark Table</label>
            <input
              id="dark-mode"
              name="dark-mode"
              type="checkbox"
              checked={isDarkMode}
              onChange={() => {
                setIsDarkMode(!isDarkMode);
                localStorage.setItem(
                  DARK_MODE_LS_KEY,
                  (!isDarkMode).toString()
                );
              }}
            />
          </span>
        </div>
        <div className={classes.filterName}>
          <StyledTextField
            label="Filter"
            value={nameFilter}
            onChange={ev => {
              setNameFilter(ev.target.value);
            }}
          />
        </div>
      </div>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell
                onClick={() => {
                  handleTableHeaderClick('name');
                }}
                className={classes.tableHeadCell}
                align="center"
              >
                Player Name{' '}
                {sortColumn === 'name' ? (
                  <SortDirectionIcon sortDirection={sortDirection} />
                ) : (
                  ''
                )}
              </StyledTableCell>
              <StyledTableCell
                onClick={() => {
                  handleTableHeaderClick('rating');
                }}
                className={classes.tableHeadCell}
                align="center"
              >
                Rating Last Played{' '}
                {sortColumn === 'rating' ? (
                  <SortDirectionIcon sortDirection={sortDirection} />
                ) : (
                  ''
                )}
              </StyledTableCell>
              <StyledTableCell
                onClick={() => {
                  handleTableHeaderClick('num_games');
                }}
                className={classes.tableHeadCell}
                align="center"
              >
                Num Games{' '}
                {sortColumn === 'num_games' ? (
                  <SortDirectionIcon sortDirection={sortDirection} />
                ) : (
                  ''
                )}
              </StyledTableCell>
              <StyledTableCell
                onClick={() => {
                  handleTableHeaderClick('wins_against');
                }}
                className={classes.tableHeadCell}
                align="center"
              >
                Wins Against{' '}
                {sortColumn === 'wins_against' ? (
                  <SortDirectionIcon sortDirection={sortDirection} />
                ) : (
                  ''
                )}
              </StyledTableCell>
              <StyledTableCell
                onClick={() => {
                  handleTableHeaderClick('losses_to');
                }}
                className={classes.tableHeadCell}
                align="center"
              >
                Losses To{' '}
                {sortColumn === 'losses_to' ? (
                  <SortDirectionIcon sortDirection={sortDirection} />
                ) : (
                  ''
                )}
              </StyledTableCell>
              <StyledTableCell
                onClick={() => {
                  handleTableHeaderClick('last_played_against');
                }}
                className={classes.tableHeadCell}
                align="center"
              >
                Last Played{' '}
                {sortColumn === 'last_played_against' ? (
                  <SortDirectionIcon sortDirection={sortDirection} />
                ) : (
                  ''
                )}
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profileIds.map(profileId => {
              const player = data.tracker.players[profileId];
              const record = data.tracker.records[profileId];

              return (
                <StyledTableRow key={profileId} isDarkMode={isDarkMode}>
                  <StyledTableCell
                    component="td"
                    scope="row"
                    isDarkMode={isDarkMode}
                  >
                    <span title={`Lookup head2head for: "${player.name}"`}>
                      <SearchIcon
                        className={classes.searchIcon}
                        onClick={() => {
                          window.location.hash = `${player.name},${props.leaderboardName}`;
                        }}
                      />
                    </span>
                    <PlayerNameLink
                      playerId={player.steam_id || player.profile_id}
                      playerName={player.name}
                      light={isDarkMode}
                    />
                  </StyledTableCell>
                  <StyledTableCell
                    component="td"
                    scope="row"
                    isDarkMode={isDarkMode}
                  >
                    {player.rating}
                  </StyledTableCell>
                  <StyledTableCell align="right" isDarkMode={isDarkMode}>
                    {record.wins_against + record.losses_to}
                  </StyledTableCell>
                  <StyledTableCell align="right" isDarkMode={isDarkMode}>
                    {record.wins_against}
                  </StyledTableCell>
                  <StyledTableCell align="right" isDarkMode={isDarkMode}>
                    {record.losses_to}
                  </StyledTableCell>
                  <StyledTableCell align="right" isDarkMode={isDarkMode}>
                    {new Date(
                      record.last_played_against + 'z'
                    ).toLocaleString()}
                  </StyledTableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default PlayerRecordsTable;

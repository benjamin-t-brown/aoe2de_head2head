import { useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = window.location.origin;

export interface LookupQueryParams {
  playerName: string;
  leaderboardName: string;
}

interface LookupQueryPlayersResult {
  [profile_id: string]: {
    profile_id: string;
    steam_id: string;
    name: string;
  };
}

interface LookupQueryRecordsResult {
  [profile_id: string]: {
    profile_id: string;
    last_played_against: string;
    losses_to: number;
    wins_against: number;
  };
}

export interface LookupQueryResult {
  error?: string;
  leaderboard_id: number;
  leaderboard_name: string;
  player_name: string;
  profile_id: string;
  tracker: {
    wins: number;
    losses: number;
    players: LookupQueryPlayersResult;
    records: LookupQueryRecordsResult;
  };
}

const cache = {};

const getCacheKey = (type: string, url: string, paramsStr: string): string => {
  return type + '/' + url + '/' + paramsStr;
};

const api = axios.create({
  baseURL: BASE_URL,
});

export const useGet = function <QueryParamsType>(
  apiUrl: string,
  params?: QueryParamsType
): [AxiosResponse | null, boolean, boolean] {
  const [data, setData] = useState<AxiosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const requestData = async () => {
      if (!apiUrl) {
        setLoading(false);
        setError(false);
        return;
      }
      const cacheKey = getCacheKey(
        'GET',
        apiUrl,
        params ? JSON.stringify(params) : ''
      );
      const cachedData = cache[cacheKey];
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(false);
      } else {
        try {
          setLoading(true);     
          const response = await api.get(apiUrl, {
            params,
          });
          setData(response);
          setLoading(false);
          setError(false);
          cache[cacheKey] = response;
        } catch (e) {
          console.error('Failed to get', e);
          setData(null);
          setLoading(false);
          setError(true);
        }
      }
    };
    requestData();
  }, [apiUrl, params]);

  return [data, loading, error];
};

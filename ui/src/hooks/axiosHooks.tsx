import { useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = window.location.origin;
const LOG_REQUESTS = (process.env as any).NODE_ENV === 'development';

export interface LookupQueryParams {
  playerName: string;
  leaderboardName: string;
}

export interface LookupQueryPlayerResult {
  profile_id: string;
  rating: string;
  steam_id: string;
  name: string;
}

export interface LookupQueryRecordResult {
  profile_id: string;
  last_played_against: string;
  losses_to: number;
  wins_against: number;
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
    players: {
      [profile_id: string]: LookupQueryPlayerResult;
    };
    records: {
      [profile_id: string]: LookupQueryRecordResult;
    };
  };
}
let cache = {};

const outgoingRequests = {};

const api = axios.create({
  baseURL: BASE_URL,
});

export const getCacheKey = (
  type: string,
  url: string,
  paramsStr?: string
): string => {
  return type + '/' + url + '/' + (paramsStr || '');
};

export const clearCache = (key?: string): boolean => {
  if (key) {
    if (cache[key]) {
      delete cache[key];
      return true;
    }
    return false;
  } else {
    cache = {};
    return true;
  }
};

export const useGet = function <QueryParamsType>(
  apiUrl: string,
  params?: QueryParamsType
): [AxiosResponse | null, boolean, boolean, string] {
  const [data, setData] = useState<AxiosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const requestData = async () => {
      if (!apiUrl) {
        setData(null);
        setLoading(false);
        setError(false);
        return;
      }
      const cacheKey = getCacheKey('GET', apiUrl, JSON.stringify(params));
      const cachedData = cache[cacheKey];
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(false);
      } else if (!outgoingRequests[cacheKey]) {
        try {
          outgoingRequests[cacheKey] = true;
          setLoading(true);
          const response = await api.get(apiUrl, {
            params,
          });
          if (LOG_REQUESTS) {
            console.log('get', cacheKey, response.data);
          }
          setData(response);
          setError(false);
          setLoading(false);
          outgoingRequests[cacheKey] = false;
          cache[cacheKey] = response;
        } catch (e) {
          console.error('Failed to get', e);
          setError(true);
          setLoading(false);
          setData(null);
        }
      }
    };
    requestData();
  }, [apiUrl, params]);

  const cacheKey = getCacheKey('GET', apiUrl, JSON.stringify(params));
  return [data, loading, error, cacheKey];
};

export const usePost = function <QueryParamsType, BodyParamsType>(
  apiUrl: string,
  params?: QueryParamsType,
  body?: BodyParamsType
): [AxiosResponse | null, boolean, boolean, string] {
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
        'POST',
        apiUrl,
        '[' + JSON.stringify(params) + ',' + JSON.stringify(body) + ']'
      );
      const cachedData = cache[cacheKey];
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(false);
      } else if (!outgoingRequests[cacheKey]) {
        try {
          outgoingRequests[cacheKey] = true;
          setLoading(true);
          const response = await api.post(apiUrl, {
            params,
            body,
          });
          if (LOG_REQUESTS) {
            console.log('post', cacheKey, response.data);
          }
          setData(response);
          setLoading(false);
          setError(false);
          outgoingRequests[cacheKey] = false;
          cache[cacheKey] = response;
        } catch (e) {
          console.error('Failed to post', e);
          setError(true);
          setData(null);
          setLoading(false);
        }
      }
    };
    requestData();
  }, [apiUrl, params, body]);

  const cacheKey = getCacheKey(
    'POST',
    apiUrl,
    '[' + JSON.stringify(params) + ',' + JSON.stringify(body) + ']'
  );
  return [data, loading, error, cacheKey];
};

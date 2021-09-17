import React, {useEffect, useState} from 'react';
import {api} from '../person-client';
import axios from 'axios';

export const usePersonSearch = (nameCriteria: string, pageNumber: number) => {

    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        setResults([]);
    }, [nameCriteria])

    useEffect(() => {
        setLoading(true);
        setError(false);

        let cancel: any;
        api.get(`/person/query?nameCriteria=${nameCriteria}&pageNumber=${pageNumber}`, {
            cancelToken: new axios.CancelToken(c => cancel = c)
        }).then(response => {
            setResults((previousResults:any[]) => {
                let set:any = {};
                let p = Array.isArray(previousResults) ? previousResults : [];
                for(let nextP of p) {
                    set[nextP.id] = nextP;
                }
                if(response.data && Array.isArray(response.data)) {
                    for(let next of response.data) {
                        set[next.id] = next;
                    }
                }

                let results = [];
                for(let k of Object.keys(set)) {
                    results.push(set[k]);
                }
                return results;
            });
            setHasMore(response.data.length > 0);
            setLoading(false);
        }).catch(e => {
            if (axios.isCancel(e)) return;
            setError(true);
        });
        return () => cancel();
    }, [nameCriteria, pageNumber]);
    return {loading, error, results, hasMore};
}
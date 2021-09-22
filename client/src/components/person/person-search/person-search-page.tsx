import React, {useCallback, useEffect, useRef, useState} from 'react';
import { Form, Table} from 'react-bootstrap';
import { Link } from "react-router-dom";
import {usePersonSearch} from './use-person-search.client';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type NameFormProps = {
    nameCriteria: string;
    onChange: (name:string) => void;
}

export const NameForm = (props:NameFormProps) => {

    const onChange = (evt: any) => {
        evt.preventDefault();
        props.onChange(evt.target.value);
    }

    return (
        <Form onSubmit={evt => evt.preventDefault()}>
            <Form.Group controlId="formName">
                <Form.Label>Search by name</Form.Label>
                <Form.Control type="text" placeholder="Enter name" value={props.nameCriteria} onChange={onChange}/>
            </Form.Group>
        </Form>
    );
}


export const PersonSearchPage = () => {

    const [nameCriteria, setNameCriteria] = useState<string>('');
    const [pageNumber, setPageNumber] = useState<number>(1);
    const {results, hasMore, loading, error} = usePersonSearch(nameCriteria, pageNumber);

    const observer = useRef();
    const lastRowElementRef = useCallback(node => {
        if (loading) return;
        if (observer && observer.current) {
            // @ts-ignore
            observer.current.disconnect();
        }
        // @ts-ignore
        observer.current = new IntersectionObserver(entries => {
            if(entries[0].isIntersecting && hasMore) {
                setPageNumber(prevPageNumber => prevPageNumber + 1);
            }
        });
        if (node) { // @ts-ignore
            observer.current.observe(node);
        }
    }, [loading, hasMore]);

    useEffect(() => {
        setPageNumber(1);
    }, [nameCriteria]);

    const personRows = results.map((person, index) => {
        if(results.length === index + 1) {
            return <tr key={person.id} ref={lastRowElementRef}>
                <td><Link to={`/app/person/view/${person.id}`}>{person.givenName} {person.familyName}</Link></td>
                <td>{person.emailAddress}</td>
            </tr>
        } else {
            return <tr key={person.id}>
                <td><Link to={`/app/person/view/${person.id}`}>{person.givenName} {person.familyName}</Link></td>
                <td>{person.emailAddress}</td>
            </tr>
        }
    });

    return (
        <div>
            <h2>Person Search</h2>

            <NameForm nameCriteria={nameCriteria} onChange={setNameCriteria}/>

            <Table striped bordered size="sm">
                <thead>
                <tr>
                    <th>Person</th>
                    <th>Email</th>
                </tr>
                </thead>
                <tbody>
                {personRows}
                </tbody>
            </Table>

            <div>{loading && 'Loading...'}</div>
            <div>{error && 'Error!'}</div>
        </div>
    );
}

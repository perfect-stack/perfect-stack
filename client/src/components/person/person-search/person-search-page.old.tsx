import React, {useEffect, useState} from 'react';
import {Button, Form, Table} from 'react-bootstrap';
import { Link } from "react-router-dom";
import { Person } from '../../../domain/person';
import {findByCriteria} from "../person-client";
import {LoadingSpinner} from "../../spinner/loading-spinner";
import {Paginator} from './paginator';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type NameFormProps = {
    nameCriteria: string;
    onChange: (name:string) => void;
    onSubmit: () => void;
}

export const NameFormOLD = (props:NameFormProps) => {

    const [loading, setLoading] = useState(false);

    const onChange = (evt: any) => {
        evt.preventDefault();
        props.onChange(evt.target.value);
    }

    const onSubmit = (evt: any) => {
        evt.preventDefault();
        props.onSubmit();
    }

    return (
        <Form onSubmit={onSubmit}>
            <Form.Group controlId="formName">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" placeholder="Enter name" value={props.nameCriteria} onChange={onChange}/>
                <Form.Text className="text-muted">
                    Filter available people by name.
                </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit">
                Submit
                <LoadingSpinner loading={loading}/>
            </Button>
        </Form>
    );
}


export const PersonSearchPageOLD = () => {

    const [nameCriteria, setNameCriteria] = useState<string>('');
    const [personList, setPersonList] = useState<Person[]>([]);
    const [pageNumber, setPageNumber] = useState<number>(1);

    useEffect(() => {
        doSearch();
    }, [pageNumber]);

    const doSearch = () => {
        const fetchData = async () => {
            const data = await findByCriteria(nameCriteria, pageNumber);
            setPersonList(data);
        }

        fetchData();
    }

    const personRows = personList.map(person =>
        <tr key={person.id}>
            <td><Link to={`/app/person/view/${person.id}`}>{person.givenName} {person.familyName}</Link></td>
            <td>{person.emailAddress}</td>
        </tr>
    );

    return (
        <div>
            <h2>Person Search</h2>

            {/*<NameForm nameCriteria={nameCriteria} onChange={setNameCriteria} onSubmit={doSearch}/>*/}
            <br/>

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

            <Paginator pageNumber={pageNumber} onChange={setPageNumber}/>
        </div>
    );
}

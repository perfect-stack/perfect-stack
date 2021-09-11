import React, {useEffect, useState} from 'react';
import {Button, Form, Table} from "react-bootstrap";
import { Link } from "react-router-dom";
import { Person } from '../../../domain/person';
import {findByCriteria} from "../person-client";
import {LoadingSpinner} from "../../spinner/loading-spinner";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type NameFormProps = {
    handleSubmit: (name:string) => void;
}

export const NameForm = (props:NameFormProps) => {

    const [name, setName] = useState('');
    const [ loading, setLoading ] = useState(false);

    const handleSubmit = async (evt: any) => {
        setLoading(true);
        if(evt) {
            evt.preventDefault();
        }
        await props.handleSubmit(name);
        setLoading(false);
    }

    useEffect(() => {
        handleSubmit('');
    }, []);

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formName">
                <Form.Label>Name</Form.Label>
                <Form.Control type="text" placeholder="Enter name" value={name} onChange={e => setName(e.target.value)}/>
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


export const PersonSearchPage = () => {

    const [personList, setPersonList] = useState<Person[]>([]);

    const handleSubmit = async (nameCriteria: string) => {
        setPersonList(await findByCriteria(nameCriteria));
    }

    const renderPersonList = personList.map(person =>
        <tr key={person.id}>
            <td><Link to={`/app/person/view/${person.id}`}>{person.givenName} {person.familyName}</Link></td>
            <td>{person.emailAddress}</td>
        </tr>
    );

    return (
        <div>
            <h2>Person Search</h2>

            <NameForm handleSubmit={handleSubmit}/>
            <br/>

            <Table striped bordered size="sm">
                <thead>
                <tr>
                    <th>Person</th>
                    <th>Email</th>
                </tr>
                </thead>
                <tbody>
                {renderPersonList}
                </tbody>
            </Table>
        </div>
    );
}

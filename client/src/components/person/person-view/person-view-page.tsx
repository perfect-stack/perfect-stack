import React, {useEffect, useState} from "react";
import { useParams } from 'react-router-dom';
import {Button, Col, Form, Row} from "react-bootstrap";
import { useHistory } from "react-router-dom";

import { Person } from "../../../domain/person";
import { findOne } from "../person-client";
import {DateTimeFormatter, LocalDate} from '@js-joda/core';


export const PersonViewPage = () => {

    const { id } = useParams<any>();
    const [ person, setPerson ] = useState(new Person());
    const history = useHistory();

    useEffect(() => {
        findOne(id).then( (person) => setPerson(person));
    }, [id]);

    const onEdit = () => {
        history.push(`/app/person/edit/${id}`);
    }

    const onCancel = () => {
        history.push(`/app/person/search`);
    }

    const renderDate = (dateValue: string | undefined): string => {
        if(dateValue) {
            const localDate = LocalDate.parse(dateValue);
            const displayFormat = DateTimeFormatter.ofPattern('dd/MM/yyyy');
            return displayFormat.format(localDate);
        }
        else {
            return '';
        }
    }

    return (
        <div>
            <h2>Person View</h2>

            <Form>
                <Form.Group as={Row} controlId="formName">
                    <Form.Label column sm="2">Name</Form.Label>
                    <Col sm="10">
                        <Form.Control plaintext readOnly value={person.getFullName()}/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="formEmailAddress">
                    <Form.Label column sm="2">Email address</Form.Label>
                    <Col sm="10">
                        <Form.Control plaintext readOnly value={person.emailAddress}/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="formBirthday">
                    <Form.Label column sm="2">Birthday</Form.Label>
                    <Col sm="10">
                        <Form.Control plaintext readOnly value={renderDate(person.birthday)}/>
                    </Col>
                </Form.Group>
            </Form>

            <br/>
            <Button onClick={onEdit}>Edit</Button>&nbsp;
            <Button variant="outline-secondary" onClick={ onCancel }>Cancel</Button>
        </div>
    );
}
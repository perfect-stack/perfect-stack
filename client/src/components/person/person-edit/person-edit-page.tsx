import {useHistory, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {Button, Col, Form, Row} from "react-bootstrap";
import { Person } from "../../../domain/person";
import {findOne, save} from "../person-client";
import {SubmitHandler, useForm} from "react-hook-form";
import {LoadingSpinner} from "../../spinner/loading-spinner";

//const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const PersonEditPage = () => {

    const { id } = useParams<any>();
    const [ loading, setLoading ] = useState(false);
    const {register, handleSubmit, formState: { errors }, reset} = useForm<Person>({
        defaultValues: new Person()
    });
    const history = useHistory();


    useEffect(() => {
        setLoading(true);
        findOne(id).then( (person) => {
            reset(person);
            setLoading(false);
        });
    }, [id, reset]);

    const onSubmit: SubmitHandler<Person> = async person => {
        setLoading(true);

        await save(person);
        history.push(`/app/person/view/${id}`);

        setLoading(false);
    }

    const onCancel = () => {
        history.push(`/app/person/view/${id}`);
    }

    return (
        <div>
            <h2 className="mb-3">Person Edit</h2>

            <Form noValidate onSubmit={handleSubmit(onSubmit)}>

                <Form.Group as={Row} controlId="formGivenName">
                    <Form.Label column sm="2">Given name</Form.Label>
                    <Col sm="10">
                        <Form.Control {...register('givenName')}/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="formFamilyName">
                    <Form.Label column sm="2">Family name</Form.Label>
                    <Col sm="10">
                        <Form.Control {...register('familyName')}/>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="formEmailAddress">
                    <Form.Label column sm="2">Email address</Form.Label>
                    <Col sm="10">
                        <Form.Control type="text"
                            {...register('emailAddress', {
                                required: {value: true, message: 'This is required'},
                                pattern: { value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, message: 'Must be a valid email address'}
                            })}
                            isInvalid={errors.emailAddress !== undefined}
                        />
                        <Form.Control.Feedback type="invalid">{errors.emailAddress?.message}</Form.Control.Feedback>
                    </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="formBirthday">
                    <Form.Label column sm="2">Birthday</Form.Label>
                    <Col sm="10">
                        <Form.Control type="date" {...register('birthday')}/>
                    </Col>
                </Form.Group>

                <Button variant="primary" type="submit" className="mr-2">
                    Submit
                    <LoadingSpinner loading={loading}/>
                </Button>
                <Button variant="outline-secondary" onClick={ onCancel }>Cancel</Button>
            </Form>

        </div>
    );

}
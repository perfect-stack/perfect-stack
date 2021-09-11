import {Button, Col, Container, Form, Image, Row} from "react-bootstrap";
import React, {useState} from "react";
import {SubmitHandler, useForm} from "react-hook-form";
import { useHistory } from "react-router-dom";

import {LoginRequest} from "./login-request";
import {LoadingSpinner} from "../spinner/loading-spinner";
import getFirebase from "../../firebase";
import {currentUserStore} from "../../app";
import firebase from "firebase";


export const LoginPage = () => {

    const firebaseInstance = getFirebase();
    const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

    const history = useHistory();
    const [ loading, setLoading ] = useState(false);
    const {register, handleSubmit, formState: { errors }, reset} = useForm<LoginRequest>({
        defaultValues: new LoginRequest()
    });

    const setUser = currentUserStore(state => state.setUser);

    const onSubmit: SubmitHandler<LoginRequest> = async loginRequest => {
        setLoading(true);

        if (firebaseInstance) {
            const userResponse = await firebaseInstance.auth().signInWithEmailAndPassword(loginRequest.emailAddress, loginRequest.password)
            const user = userResponse.user;
            console.log("user", user)

            setUser(user);

            // TODO: redirect to the page the user requested
            history.push('/app/person/search');
        }

        setLoading(false);
    }

    const onGoogleSignin = async () => {
        setLoading(true);

        if (firebaseInstance) {
            firebase.auth()
                .signInWithPopup(googleAuthProvider)
                .then((result) => {

                    setUser(result.user);

                    // TODO: redirect to the page the user requested
                    history.push('/app/person/search');

                }).catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(`Sign-in error: ${errorCode} ${errorMessage}`);
            });
        }

        setLoading(false);
    }

    return (
        <Container>
            <Row xs={1} md={1} lg={2}>
                <Col>
                    <Form noValidate onSubmit={handleSubmit(onSubmit)}>

                        <Form.Group as={Row} controlId="formEmailAddress">
                            <Form.Label column sm="2">Email</Form.Label>
                            <Col sm="10">
                                <Form.Control {...register('emailAddress')}/>
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} controlId="formPassword">
                            <Form.Label column sm="2">Password</Form.Label>
                            <Col sm="10">
                                <Form.Control type="password" {...register('password')}/>
                            </Col>
                        </Form.Group>

                        <Button variant="primary" type="submit" className="mr-2">
                            Submit
                            <LoadingSpinner loading={loading}/>
                        </Button>

                        <p className="mt-5">Or signin with Google.</p>
                        <Image src="/assets/btn_google_signin_dark_normal_web.png" onClick={onGoogleSignin}>
                        </Image>
                    </Form>
                </Col>
            </Row>
        </Container>
    )
}
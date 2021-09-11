import {Spinner} from "react-bootstrap";
import React from "react";

type LoadingSpinnerProps = {
    loading: boolean;
}

export const LoadingSpinner = (props: LoadingSpinnerProps) => {

    let TheSpinner;
    if(props.loading) {
        TheSpinner = <Spinner as="span" animation="border" size="sm"/>;
    }
    else {
        TheSpinner = '';
    }

    return (
        <span className="loading-spinner">
            {TheSpinner}
        </span>
    );
}
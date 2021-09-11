import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import {currentUserStore} from "./app";


export const ProtectedRoute: React.FC<RouteProps> = ({
                                   component: Component,
                                   ...rest
                               }) => {

    // https://stackoverflow.com/questions/53452966/typescript-3-jsx-element-type-component-does-not-have-any-construct-or-call-s
    if (!Component) return null;

    const currentUser = currentUserStore(state => state.user);

    return (
        <Route
            {...rest}
            render={props => {
                if (currentUser) {
                    return <Component {...props} />;
                } else {
                    return (
                        <Redirect
                            to={{
                                pathname: "/",
                                state: {
                                    from: props.location
                                }
                            }}
                        />
                    );
                }
            }}
        />
    );
};

import React from 'react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import create from 'zustand';
import {AppLayout} from "./app.layout";
import {ProtectedRoute} from "./protected.route";
import {LandingPage} from "./landing.page";


type UserState = {
    user: any,
    setUser: (newUser: any) => void
}

export const currentUserStore = create<UserState>(set => ({
    user: null,
    setUser: (newUser: any) => set({ user: newUser })
}))


export const App = () => {

    return (
        <Router>
            <nav className="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
                <a className="navbar-brand" href="/">Demo</a>
            </nav>
            <main role="main" className="container">
                <Switch>
                    <Route exact path="/" component={LandingPage} />
                    <ProtectedRoute path="/app" component={AppLayout} />
                    <Route path="*" component={NotFound} />
                </Switch>
            </main>
        </Router>
    );
}

const NotFound = () => {
    return (
        <div>404 NOT FOUND</div>
    )
}

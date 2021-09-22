import React, {useEffect} from 'react';
import {BrowserRouter as Router, Switch, Route, Redirect} from 'react-router-dom';
import {LandingPage} from "./landing.page";
import {PersonSearchPage} from './components/person/person-search/person-search-page';
import {PersonViewPage} from './components/person/person-view/person-view-page';
import {PersonEditPage} from './components/person/person-edit/person-edit-page';
import create from 'zustand';
import firebase from "firebase";
import {Navbar, NavbarBrand, NavLink} from 'react-bootstrap';
import {LoadingSpinner} from './components/spinner/loading-spinner';
import getFirebase from './firebase';


type UserState = {
    user: any,
    setUser: (newUser: any) => void
}

export const currentUserStore = create<UserState>((set) => ({
    // The initial state for user is "Loading". User persistence features take a little while to load the user.
    user: 'Loading',
    setUser: (newUser: any) => set({ user: newUser })
}));

const onAuthStateChange = () => {
    return getFirebase().auth().onAuthStateChanged((user: any) => {
        if (user) {
            currentUserStore.setState({user: user});
        }
        else {
            currentUserStore.setState({user: null});
        }
    });
}

const onSignOut = async () => {
    await firebase.auth().signOut();
    currentUserStore.setState({user: null});
}

export const App = () => {

    const currentUser = currentUserStore(state => state.user);

    useEffect(() => {
        const unsubscribe = onAuthStateChange();
        return () => {
            unsubscribe();
        };
    }, [currentUser]);

    let routes;
    if (currentUser === 'Loading') {
        routes = <LoadingSpinner loading={true}/>
    }
    else if(currentUser) {
        routes = <Switch>
            <Route path="/app/person/search">
                <PersonSearchPage/>
            </Route>
            <Route path="/app/person/view/:id">
                <PersonViewPage/>
            </Route>
            <Route path="/app/person/edit/:id">
                <PersonEditPage/>
            </Route>
            <Redirect to="/app/person/search"/>
        </Switch>
    }
    else {
        routes = <Switch>
            <Route path="/" exact={true}>
                <LandingPage/>
            </Route>
            <Redirect to="/"/>
        </Switch>
    }

    return (
        <>
            <Navbar bg="dark" variant="dark">
                <NavbarBrand href="#home">Perfect-Stack</NavbarBrand>
                <NavLink onClick={onSignOut}>Sign out</NavLink>
            </Navbar>
            <main role="main" className="container">
                <Router>
                    {routes}
                </Router>
            </main>
        </>
    );
}

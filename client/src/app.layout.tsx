import React from "react";
import {Route} from "react-router-dom";
import {PersonSearchPage} from "./components/person/person-search/person-search-page";
import {PersonViewPage} from "./components/person/person-view/person-view-page";
import {PersonEditPage} from "./components/person/person-edit/person-edit-page";

export const AppLayout = (props: any) => {
    return (
        <div>
            <Route path="/app/person/search">
                <PersonSearchPage/>
            </Route>
            <Route path="/app/person/view/:id">
                <PersonViewPage/>
            </Route>
            <Route path="/app/person/edit/:id">
                <PersonEditPage/>
            </Route>
        </div>
    );
};

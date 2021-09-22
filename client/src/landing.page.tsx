import React from "react";
import {LoginPage} from "./components/login/login-page";
import {Link} from 'react-router-dom';

export const LandingPage = (props: any) => {
    return (
        <div>
            <h1 className='mb-4'>Landing Page</h1>

            {/* Just chucking this here for now */}
            <LoginPage/>

            <div className='mt-5'>
                <ul>
                    <li><Link to="/app/person/search">Search</Link></li>
                    <li><Link to="/app/person/view/001c7006-d298-4db8-ba54-07b2be9c6971">View</Link></li>
                    <li><Link to="/app/person/edit/001c7006-d298-4db8-ba54-07b2be9c6971">Edit</Link></li>
                </ul>
            </div>
        </div>
    );
};

import React from "react";
import {LoginPage} from "./components/login/login-page";

export const LandingPage = (props: any) => {
    return (
        <div>
            <h1 className='mb-4'>Landing Page</h1>

            {/* Just chucking this here for now */}
            <LoginPage/>
        </div>
    );
};

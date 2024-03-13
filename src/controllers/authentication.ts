import  express from "express";
import { createUser, getUserByEmail } from "../db/users";
import { authentication, random } from "../helpers";

export const register = async (req: express.Request, res: express.Response) => {
    try{
        const {email, password, username} = req.body;
        if(!email || !password || !username){
            return res.sendStatus(400);
        }
        const existingUser = await getUserByEmail(email);
        if(existingUser){
            return res.sendStatus(400);
        }

        const salt = random();

        const user = await createUser({
            email,
            username,
            Authentication: {
                salt,
                password: authentication(salt, password),
            }
        });

        return res.status(200).json(user);
    }catch(error){
        console.log(error);
        return res.sendStatus(400);
    }
}

export const login = async (req: express.Request, res: express.Response) => {
    try{
        const {email, password} = req.body;
        
        if(!email || !password){
            return res.sendStatus(400);
        }
        const user = await getUserByEmail(email).select('+Authentication.salt +Authentication.password');
        
        if(!user){
            return res.sendStatus(400);
        }

        const expectedHash = authentication(user.Authentication.salt, password);

        if (user.Authentication.password !== expectedHash){
            return res.sendStatus(403);
        }

        const salt = random();
        user.Authentication.sessionToken = authentication(salt, user._id.toString());
        await user.save();

        res.cookie('FACHMI-AUTH', user.Authentication.sessionToken, {domain: 'localhost', path: '/'});

        return res.status(200).json(user)
    }catch(error){
        console.log(error);
        return res.sendStatus(400);
    }
}
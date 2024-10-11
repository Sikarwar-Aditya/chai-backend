import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
 } 
 from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router= Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser); // middleware used because we need user to get refresh token to reset it 
router.route("/refresh-token").post(refreshAccessToken);//no middlware is used becoz user is not required in req

router.route("/change-password").post(verifyJWT,changeCurrentPassword);
// we are taking dat so get method is used
router.route("/current-user").get(verifyJWT,getCurrentUser);
// be careful use always patch other wise whole data will be changed with post method , but with patch method only given fields will be updated
router.route("/update-account").patch(verifyJWT,updateAccountDetails);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);

// with params we have to use this type of syntax and username is used here because in controller same name is used
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

router.route("/history").get(verifyJWT,getWatchHistory);





export default router;
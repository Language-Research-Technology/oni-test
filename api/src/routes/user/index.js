import {getLogger} from '../../services';
import {isUndefined} from 'lodash';
import {getUser, updateUser} from '../../controllers/user';
import {v4 as uuidv4} from 'uuid';
import {routeUser} from '../../middleware/auth';
import {getGithubMemberships} from "../../controllers/github";
import {getCiLogonMemberships} from "../../controllers/cilogon";
import * as utils from '../../services/utils';

const log = getLogger();

export function setupUserRoutes({server, configuration}) {

  /**
   * @openapi
   * /:
   *   get:
   *     description: User
   *     responses:
   *       200:
   *         description: Returns user information including Group Membership.
   */
  server.get("/user", routeUser(async (req, res, next) => {
      try {
        if (req.session.user) {
          const user = await getUser({where: {id: req.session.user.id}});
          user['apiToken'] = null;
          user['accessToken'] = '....removed';
          res.json({user}).status(200);
          //Testing: Setting up memberships after login
          if (configuration.api.authentication['cilogon']) {
            await getCiLogonMemberships({configuration, user});
          } else if (configuration.api.authentication['github']) {
            await getGithubMemberships({configuration, userId: user.id, group: configuration['api']['licenseGroup']});
          }
        } else {
          res.json({user: null}).status(200);
        }
      } catch (e) {
        log.error(e);
        res.send({error: e['message']}).status(500);
        next();
      }
    })
  );

  /**
   * @openapi
   * /:
   *   get:
   *     description: Set user token
   *     responses:
   *       200:
   *         description: Returns user information including Group Membership.
   */
  server.get("/user/token", routeUser(async (req, res, next) => {
      try {
        if (req.session.user) {
          const tokenConf = configuration.api.tokens;
          const id = req.session.user.id;
          const apiToken = uuidv4();
          const user = await updateUser({
            where: {where: {id: id}},
            key: 'apiToken',
            value: utils.encrypt(tokenConf.secret, apiToken, tokenConf.accessTokenPassword) //Using the same initVector when encrypted to be able to compare it.
          });
          user['accessToken'] = '...removed';
          user['refreshToken'] = '...removed';
          user['apiToken'] = apiToken; //Returns in plain text for consuming
          res.json({user}).status(200);
        } else {
          res.json({user: null}).status(200);
        }
      } catch (e) {
        log.error(e);
        res.send({error: e['message']}).status(500);
        next();
      }
    })
  );
  /**
   * @openapi
   * /:
   *   del:
   *     description: Remove user token
   *     responses:
   *       200:
   *         description: Returns user information.
   */
  server.del("/user/token", routeUser(async (req, res, next) => {
      try {
        if (req.session.user) {
          const id = req.session.user.id;
          const user = await updateUser({
            where: {where: {id: id}},
            key: 'apiToken',
            value: null
          });
          user['accessToken'] = '...removed';
          user['refreshToken'] = '...removed';
          res.json({user});
        } else {
          res.json({user: null});
        }
      } catch (e) {
        log.error(e);
        res.status(500);
        res.send({error: e['message']})
        next();
      }
    })
  );
}

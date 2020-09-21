import { ApolloQuery, html } from '@apollo-elements/lit-apollo';
import { classMap } from 'lit-html/directives/class-map';

import { getUserStyleMap } from '../../lib/user-style-map';
import userStatusUpdatedSubscription from './user-status-updated-subscription.graphql';
import userPartedSubscription from '../../user-parted-subscription.graphql';
import userJoinedSubscription from '../../user-joined-subscription.graphql';

import shared from '../shared-styles.css';
import style from './leeway-userlist.css';

const userTemplate = ({ nick, status } = {}) => (html`
  <div class="user" style="${getUserStyleMap({ nick, status })}">
    <span aria-label="${status}" class="status ${classMap({ ...status && { [status.toLowerCase()]: true } })}"></span>
    ${nick}
  </div>
`);

const isNotParted =
  user =>
    user && user.status !== 'PARTED';

const onStatusUpdated = (prev, { subscriptionData: { data: { userStatusUpdated } } }) => ({
  ...prev,
  users: [
    userStatusUpdated,
    ...prev.users.filter(user => user.id !== userStatusUpdated.id),
  ].filter(isNotParted),
});

const onUserJoined = (prev, { subscriptionData: { data: { userJoined } } }) => ({
  ...prev,
  users: [
    userJoined,
    ...prev.users,
  ].filter(Boolean),
});

const onUserParted = (prev, { subscriptionData: { data: { userParted } } }) => ({
  ...prev,
  users: prev.users.map(user => ({
    ...user,
    ...(user.id === userParted.id ? userParted : {}),
  })),
});


/**
 * <leeway-userlist>
 * @customElement
 * @extends LitElement
 */
class LeewayUserlist extends ApolloQuery {
  static get styles() {
    return [shared, style];
  }

  render() {
    const { users = [], localUser = {} } = this.data || {};
    return (html`
      ${this.error && this.error.message}
      <section id="links"><slot name="links"></slot></section>
      <section id="users">
        <header style="${getUserStyleMap(localUser)}" class="${classMap({ invisible: !localUser.id })}">
          <span role="presentation" class="status ${localUser.status.toLowerCase()}"></span>
          <span class="nick">${localUser.nick}</span>
        </header>
        ${users
        .filter(user => user.id !== localUser.id)
        .map(userTemplate)}
      </section>
    `);
  }

  firstUpdated() {
    const onError = this.onSubscriptionError.bind(this);
    // eslint-disable-next-line max-len
    this.subscribeToMore({ updateQuery: onStatusUpdated, document: userStatusUpdatedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserJoined, document: userJoinedSubscription, onError });
    this.subscribeToMore({ updateQuery: onUserParted, document: userPartedSubscription, onError });
  }

  onSubscriptionError(error) {
    this.error = error;
  }
}

customElements.define('leeway-userlist', LeewayUserlist);

import React, { Component, createRef } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom';
import './App.scss';

import socketio from 'socket.io-client';

import { CircularProgress } from '@material-ui/core';

import VideoPlayer from './components/VideoPlayer';
import AdminDashboard from './components/Dashboard';

import EmergencyLift from './components/Emergency/Lift';
import EmergencyAdmin from './components/Emergency/Admin';
/* import { Security } from '@material-ui/icons'; */

class App extends Component {
  constructor(props) {
    super(props);

    this.socket = createRef();

    this.state = {
      socketId: '',
      callerSocketId: '',
      callerSignal: {},
      redirect: '',
      side: ''
    };
  }

  componentDidMount() {
    (async () => {
      Security.setIgnoreCertificateErrors(true);
      this.socket.current = socketio.connect('https://192.168.137.1:8080');

      /* socket.on('') */
      // TODO
      // - emit key

      const res = await (await fetch('app.json')).json();

      const socket = this.socket.current;

      res.side = window.location.href.toString().split('?')[1].split('=')[0];
      res.id = window.location.href.toString().split('?')[1].split('=')[1];

      if (res.side === 'lift') {
        socket.emit('addUser', res.id);

        socket.on('emergency-start', () => {
          this.emergency();
        });
        
      } else if (res.side === 'admin') {
        socket.emit('addAdmin', res.id);

        socket.on('requestingCall', data => {
          this.setState({
            callerSocketId: data.from,
            callerSignal: data.signal,

            redirect: '/emergency'
          });
  
          this.emergency();
        });
      }
      
      this.setState({ socketId: res.id });
      this.setState({ side: res.side });

      socket.on('emergency-end', () => {
        this.setState({ redirect: '/' });
      });
    })();
  }

  emergency() {
    this.setState({ redirect: '/emergency' });

    this.setState({ redirect: '' });
  }
  
  render() {
    const timestamp = Date.now();
    const sides = {
      lift: {
        idle: <VideoPlayer></VideoPlayer>,
        emergency: <EmergencyLift socketId={this.state.socketId} socket={this.socket.current} pic='Lorem bin Itsum' at='Lift 1, FKOM Building, Pekan' timestamp={timestamp}></EmergencyLift>
      },
      admin: {
        idle: <AdminDashboard socket={this.socket.current}/>,
        emergency: <EmergencyAdmin socketId={this.state.socketId} callerSocketId={this.state.callerSocketId} callerSignal={this.state.callerSignal} socket={this.socket.current} pic='FKOM_LIFT_#1' at='Lift 1, FKOM Building, Pekan' timestamp={timestamp}></EmergencyAdmin>
      }
    };
    
    return (
      <Router onChange={this.update}>
        {(this.state.redirect !== '') ? <Redirect to={this.state.redirect} /> : ''}
        <div className="App">
          <Switch>
            {(this.state.side === '') ? (
                <>
                  <div className="preloading">
                    <div className="loading-anim">
                      <CircularProgress size='50px' thickness={5} style={{color: '#AFAFAF'}}/>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Route exact path='/'>
                    {sides[this.state.side].idle}
                  </Route>
                  <Route exact path='/emergency'>
                    {sides[this.state.side].emergency}
                  </Route>
                </>
              )}
            
          </Switch>
          
        </div>

        
      </Router>
      
    );
  }
  
}

export default App;

'use strict';
import React from 'react';
import WaitingRoom from './WaitingRoom.jsx';
import PlayingGame from './PlayingGame.jsx';
import EndOfGame from './EndOfGame.jsx';
import $ from 'jquery';
import io from 'socket.io-client';
import { PageHeader } from 'react-bootstrap';
import ChatWindow from '../Chat/ChatWindow.jsx';

var hostUrl = process.env.LIVE_URL || 'http://localhost:3000/';

const socket = io();

class Game extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      game: null,
      username: null,
      seconds: null,
      secondsToRound: null,
    };


    this.getGameData = this.getGameData.bind(this);
    this.getUsername = this.getUsername.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handlePromptSubmission = this.handlePromptSubmission.bind(this);
    this.handleJudgeSelection = this.handleJudgeSelection.bind(this);

    socket.on('update waiting room', (gameObj) => {
      this.setState({game: gameObj});
    })

    socket.on('countdown to start game', (secondsLeft) => {
      this.setState({seconds: secondsLeft});
    })

    socket.on('start game', (gameObj) => {
      this.setState({game: gameObj});
    })

    socket.on('prompt added', (gameObj) => {
      this.setState({game: gameObj});
    })
    socket.on('start judging', (gameObj) => {
      this.setState({game: gameObj});
    })
    socket.on('winner chosen', (gameObj) => {
      this.setState({game: gameObj});
    })
    socket.on('countdown to next round', (secondsLeft) => {
      this.setState({secondsToRound: secondsLeft})
    })
    socket.on('start next round', (gameObj) => {
      this.setState({game: gameObj, secondsToRound: null});
    })
    socket.on('game over', (gameObj) => {
      this.setState({game: gameObj});
    })
    socket.on('disconnectTimeOut', () => {
      this.props.route.sendToLobby.call(this, true);
    })


  }

  componentDidMount() {
    this.getGameData(this.props.params.gamename);
    this.getUsername();
  }


  getGameData(gameName) {
    // use gameName to retrieve gameInstance obj of that game
    $.ajax({
      url: '/game',
      method: 'GET',
      headers: {'content-type': 'application/json'},
      data: {name: gameName},
      success: (data) => {
        this.setState({game: data[0]})
      },
      error: (err) => {
          console.log('error getting games: ', err);
      }
    });
  }

  getUsername() {
    $.ajax({
      url: '/username',
      method: 'GET',
      headers: {'content-type': 'application/json'},
      success: (username) => {
        this.setState({username: username}, function() {
          socket.emit('join game', {gameName: this.props.params.gamename, username: this.state.username});
        });
      },
      error: (err) => {
        console.log('error getting username', err);
      }
    });
  }

  handleResponse(response) {
    socket.emit('submit response', {gameName: this.props.params.gamename, username: this.state.username, response: response});
  }

  handleJudgeSelection(winner) {
    socket.emit('judge select and ready to move on', {gameName: this.props.params.gamename, winner: winner});
  }

  handlePromptSubmission(prompt) {
    socket.emit('prompt created', {gameName: this.props.params.gamename, prompt: prompt});
  }



  render() {

    return (
      <div id="game">
        {this.state.game && this.state.username && this.state.game.gameStage === 'waiting' && <WaitingRoom game={this.state.game} user={this.state.username} seconds={this.state.seconds} sendToLobby={this.props.route.sendToLobby} />}

        {this.state.game && this.state.username && this.state.game.gameStage === 'playing' && <PlayingGame game={this.state.game} user={this.state.username} secondsToRound={this.state.secondsToRound} handleResponse={this.handleResponse} handlePromptSubmission={this.handlePromptSubmission} handleJudgeSelection={this.handleJudgeSelection}/>}

        {this.state.game && this.state.username && this.state.game.gameStage === 'gameover' && <EndOfGame game={this.state.game} sendToLobby={this.props.route.sendToLobby}/>}

        <ChatWindow userName={this.state.username}/>

      </div>
    )
  }
}

export default Game;

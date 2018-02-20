import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaygroundComponent } from './playground.component';


// PlaygroundComponent is a strange case for unit testing; probably
//   better done as part of an eventual e2e piece.
// (It's basically just a special-case wrapping for EditorComponent,
//   and thus would require so much stubbing of the editor that it
//   loses value as a test.)
//
// Leaving this file here as explanation for lack of tests.

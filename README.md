# WebAssembly quantum-simulator
Quantum Simulator in WebAssembly for Classical Developers 💻 

This is a very basic implementation of a Quantum Simulator in 200 lines of AssemblyScript to learn the basic component.
Allow to create your Quantum circuits with the basic Quantum Gates, and you can execute it using plain python

more info about AssemblyScript: https://www.assemblyscript.org/introduction.html

# Components
- Quantum Circuit Class:
    - Quantum Gates: x, rx, ry, rz, z, y, h, cx
- Quanrtum Simulator Class: 
    - imput: Qcircuit
    - outputs: 
        - statevector
        - counts
        - memory

# Example:

Modify the [assembly/qengine.ts](assembly/qengine.ts) after line 200 to add your circuit

```
    let qc = new QuantumCircuit(qubits);
    
    qc.h(0)
    qc.cx(0,1)

    let qs = new QuantumSimulator(qc);
    qs.run()
    let result = qs.statevector()
```

# Run:

Install dependencies
```  
npm install
```

Compile to WASM
```
npm run asbuild 
```
Run
```
 npm start
```

# TODO:
- better integration, sending the circuit from the host
- Integrate with https://github.com/JavaFXpert/grok-bloch bloch sphere visualization

# references
Inspired in MicroQiskit python implementation https://github.com/qiskit-community/MicroQiskit by James Wootton

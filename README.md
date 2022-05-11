# WebAssembly quantum-simulator
Quantum Simulator in WebAssembly for Classical Developers 💻 

This is a very basic implementation of a Quantum Simulator in AssemblyScript to learn the basic component.
Allow to create your Quantum circuits with the basic Quantum Gates, and you can execute it using plain python

more info about AssemblyScript: https://www.assemblyscript.org/introduction.html

# Components
- Quantum Circuit Class:
    - Quantum Gates: x, rx, ry, rz, z, y, h, cx, m
- Quanrtum Simulator Class: 
    - imput: Qcircuit
    - outputs: 
        - statevector
        - counts
        - memory

# Example:
    // Create your quantum circuit with 5 Qubits
    qc = new Qcircuit(5)
    qc.x(0);
    qc.rx(0,2);
    qc.x(1)
    qc.x(0)
    qc.x(2)
    qc.z(0)
    qc.x(0)
    
    qc.h(2)
    qc.h(0)
    qc.h(1)
    
    qc.cx(0,1);
    qc.cx(0,1);
    qc.m(0,0);
    
    console.log(qc.circuit);
    
    // use the quantum simulator
    qsimulator = new Qsimulator(qc)
    statevector = qsimulator.run("statevector")
    console.log(statevector)
    counts = qsimulator.run("counts", 1024)
    console.log(counts)



# TODO:
- Integrate with https://github.com/JavaFXpert/grok-bloch bloch sphere visualization

# references
Inspired in MicroQiskit python implementation https://github.com/qiskit-community/MicroQiskit by James Wootton

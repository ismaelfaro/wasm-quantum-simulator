// define some constants/types to use in the APP.
const r2=0.70710678118;
const pi=Math.PI;
class Complex {
  constructor(public r: f64, public i:f64) {}
}

class Gate{
  constructor(public name:string, public qubit:i32, public target:i32, public theta:f64){}
  toString():String{ return '['+this.name +','+ this.qubit.toString() +','+ this.target.toString() +','+ this.theta.toString() + ']'}
}

class QuantumCircuit {
    Bits: i32;
    circuit: Array<Gate>;

    constructor(public Qubits: i32){
        if (Qubits <= 0 ){ console.error("Number of Qubits need to ne more than 0") } 
        this.Bits = Qubits;
        this.circuit = [];
    }

    addGate(gate:Gate):void {this.circuit.push(gate)}

    public x(qubit:i32):void {this.addGate(new Gate('x',qubit,0,0.0))}
    public rx(qubit:i32, theta:f64):void { this.addGate(new Gate('rx',qubit, 0, theta))}
    public h(qubit:i32):void { this.addGate(new Gate('h',qubit,0,0.0)); }
    public cx(qubit:i32,target:i32):void { this.addGate(new Gate('cx',qubit,target,0.0)); }
    
    public ry(qubit:i32, theta:f64):void {
        this.rx(qubit,pi/2);
        this.h(qubit);
        this.rx(qubit,theta);
        this.h(qubit);
        this.rx(qubit,-pi/2);
    }
    public rz(qubit:i32, theta:f64):void {
        this.h(qubit);
        this.rx(qubit,theta);
        this.h(qubit);
    }
    public z(qubit:i32):void { this.rz(qubit,pi) }
    public y(qubit:i32):void { this.rz(qubit,pi); this.x(qubit);}
    
    toString():String {return this.circuit.toString()}
}

class QuantumSimulator{
    circuit: Array<Gate>;
    Qubits: i32;
    Bits: i32;
    stateVector: Array<Complex>

    constructor(quantumCircuit:QuantumCircuit){
        this.circuit = quantumCircuit.circuit;
        this.Qubits =  quantumCircuit.Qubits;
        this.Bits =  quantumCircuit.Qubits;
        this.stateVector = new Array(Math.pow(2,quantumCircuit.Qubits) as i32);
        this.initializeStateVector()
    }

    initializeStateVector():void  {
        for (let i = 0; i < this.stateVector.length; ++i) { this.stateVector[i] = new Complex(0.0,0.0) }
        this.stateVector[0]=new Complex(1.0,0.0);
    }

    superpose(x:Complex,y:Complex):Array<Complex> {
        return [new Complex( r2*(x.r+y.r),r2*(x.i+y.i)),
                new Complex( r2*(x.r-y.r),r2*(x.i-y.i))]
    };

    turn(x:Complex,y:Complex,theta:f64):Array<Complex> {
        let part1:Complex = new Complex(x.r*Math.cos(theta/2)+y.i*Math.sin(theta/2),
                                        x.i*Math.cos(theta/2)-y.r*Math.sin(theta/2));
        let part2:Complex = new Complex(y.r*Math.cos(theta/2)+x.i*Math.sin(theta/2),
                                        y.i*Math.cos(theta/2)-x.r*Math.sin(theta/2));
        return [part1, part2]
    };

    probability(shots:i32):Array<String> {
        let probabilities:Array<f64> = []
         for(let i=0; i < this.stateVector.length;i++){
            let value = this.stateVector[i]
            probabilities.push(Math.pow( value.r,2)+Math.pow(value.i,2))
        }

        let output:Array<String> = []
        for(let shotsCount=0; shotsCount < shots;shotsCount++){
            let cumu:f64 =0.0
            let un= true
            let r = Math.random()
            for(let i=0; i < probabilities.length;i++){
                cumu+=probabilities[i]
                if(r < cumu && un){
                    let raw_output = i.toString(2).padStart(this.Qubits, '0');
                    output.push(raw_output)
                    un=false;
                }
            }
        }
        return output;
    }

    stateVector2str():string {
        let output = "";
        for(let i=0; i <  this.stateVector.length;i++){
            let value = this.stateVector[i]
            let bits = i.toString(2).padStart(this.Qubits, '0')
            output += bits +' '+ value.r.toString()+'+'+value.i.toString() +'j\n'
        }
        return output;
    }

    public statevector():string {
      return this.stateVector2str();
    }

    public memory(shots:i32 = 1024):Array<String>{
      return this.probability(shots);
    }

    public counts(shots:i32 = 1024):Map<String,i32> {
      let probabilities = this.probability(shots);
      let counts = new Map<String,i32>()
      for(let i=0; i <  probabilities.length;i++){
      let value = probabilities[i]
          if(counts.has(value)){
              counts.set(value,counts.get(value)+1);
          } else {
              counts.set(value,1);
          }
      }
      return counts;
    }

    public toString():String{

        let counts_result = this.counts();
        let text = counts_result.keys.toString();
        return  text
    }

    public run(shots:i32 = 1024):void {
      
        for (let i = 0; i < this.circuit.length; ++i) {
            var gate:Gate = this.circuit[i]
            // one Gate instructions
            if (['x','h','rx'].includes(gate.name)){
                for(let contQubit=0; contQubit < Math.pow(2,gate.qubit); contQubit++){
                    for(let contState=0; contState < Math.pow(2,this.Qubits-gate.qubit-1); contState++){
                        let b0=contQubit+Math.pow(2,gate.qubit+1)*contState as i32;
                        let b1=(b0+Math.pow(2,gate.qubit)) as i32 ;
                        if(gate.name == 'x'){
                            let temp:Complex = this.stateVector[b0]
                            this.stateVector[b0] = this.stateVector[b1]
                            this.stateVector[b1] = temp
                        }
                        if(gate.name == 'h') {
                            let superpositionResult = this.superpose(this.stateVector[b0],this.stateVector[b1]);
                            this.stateVector[b0] = superpositionResult[0];
                            this.stateVector[b1] = superpositionResult[1];
                        }
                        if(gate.name == 'rx'){
                            let turn = this.turn(this.stateVector[b0],this.stateVector[b1],gate.theta);
                            this.stateVector[b0] = turn[0];
                            this.stateVector[b1] = turn[1];
                        }
                    }   
                }
            }else{
                // two Gates Instructions
                if(gate.name == 'cx'){
                    let loopLimit = [gate.qubit, gate.target];
                    if(gate.target<gate.qubit){
                        loopLimit[0] = gate.target;
                        loopLimit[1] = gate.qubit;
                    } 
                    for(let cx0=0;cx0<Math.pow(2,loopLimit[0]);cx0++){
                        for(let cx1=0;cx1<Math.pow(2,loopLimit[0]-loopLimit[1]-1);cx1++){
                            for(let cx2=0;cx2<Math.pow(2,this.Qubits-(loopLimit[1] as i32)-1);cx2++){
                                let b0 =    (cx0 + 
                                            Math.pow(2,loopLimit[0]+1)*cx1 +
                                            Math.pow(2,loopLimit[1]+1)*cx2 + 
                                            Math.pow(2,gate.qubit)) as i32;

                                let b1 = (b0 + Math.pow(2,gate.target) as i32)

                                let temp = this.stateVector[b0]
                                this.stateVector[b0] = this.stateVector[b1];
                                this.stateVector[b1] = temp;
                            }
                        }
                    }     
                }
            }
        }
    }
}


export function runQuantumSimulator(qubits: i32):String {
    
    let qc = new QuantumCircuit(qubits);
    
    qc.h(0)
    qc.cx(0,1)

    let qs = new QuantumSimulator(qc);
    qs.run()
    let result = qs.statevector()

    return result
}

// instancing - https://github.com/SaschaWillems/webgl/blob/master/webgl2_instancing/

class ParticleRender {
    
    constructor(params) {

        this.ctx = params.renderer.ctx;

        this.renderer = params.renderer;
        this.camera = params.camera;

        this.bufferWidth = params.bufferWidth;
        this.bufferHeight = params.bufferHeight;

        this.numInstance = this.bufferWidth * this.bufferHeight;

        this.isInit = false;

        this.particleBehaviours = new ParticleBehaviours(params);
        this.particleSystem = new ParticleSystem(params, () => {
            
            this.isInit = true;
            this.updateMatrixUniforms();
        });
        
        this.ctx.enable( gl.DEPTH_TEST );
        this.ctx.depthFunc( gl.LEQUAL );
    }

    update () {

        this.particleBehaviours.update();
        // this.particleBehaviours.debug();
        
        this.updateTextureUniforms( 
            this.particleBehaviours.positionBuffer,
            this.particleBehaviours.velocityBuffer  
        );
    }

    render() {

        if(!this.isInit) return;

        let gl = this.ctx;

        gl.viewport( 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight );

        gl.useProgram( this.particleSystem.program );

        gl.bindVertexArray( this.particleSystem.VAO );
        
        this.updateAttributes();
        
        // gl.drawArraysInstanced(gl.POINTS, 0, this.particleSystem.particle.vertCount, this.numInstance);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, this.particleSystem.particle.vertCount, this.numInstance);

        gl.bindVertexArray( null );
    }

    updateAttributes() {

        gl.bindBuffer( gl.ARRAY_BUFFER, this.particleSystem.buffers.vertices );
        gl.vertexAttribPointer( this.particleSystem.attributes.postion, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray( this.particleSystem.attributes.postion );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.particleSystem.buffers.normals );
        gl.vertexAttribPointer( this.particleSystem.attributes.normal, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( this.particleSystem.attributes.normal );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.particleSystem.buffers.texcoords );
        gl.vertexAttribPointer( this.particleSystem.attributes.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray( this.particleSystem.attributes.uv );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.particleSystem.buffers.instanceColors );
        gl.vertexAttribPointer( this.particleSystem.attributes.instanceColors, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor( this.particleSystem.attributes.instanceColors, 1);
        gl.enableVertexAttribArray( this.particleSystem.attributes.instanceColors );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.particleSystem.buffers.instanceTexcoords );
        gl.vertexAttribPointer( this.particleSystem.attributes.instanceTexcoords, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor( this.particleSystem.attributes.instanceTexcoords, 1);
        gl.enableVertexAttribArray( this.particleSystem.attributes.instanceTexcoords );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
    }

    updateMatrixUniforms() {

        if(!this.isInit) return;

        let gl = this.ctx;

        gl.useProgram( this.particleSystem.program );

        let _tempWorld = new THREE.Matrix4().identity();
        let _tempNormal = new THREE.Matrix3().getNormalMatrix( _tempWorld );

        // *must update threejs camera inverse matrix
        this.camera.matrixWorldInverse.getInverse( this.camera.matrixWorld );
        
        let worldInversMatrix = this.camera.matrixWorldInverse;
        
        let rotInverseMatrix = new THREE.Matrix4().identity();
        rotInverseMatrix.makeRotationFromQuaternion( this.camera.quaternion );
        rotInverseMatrix.getInverse(rotInverseMatrix, true);
        
        let viewMatrix = new THREE.Matrix4().identity();
        viewMatrix.multiplyMatrices(rotInverseMatrix, worldInversMatrix);

        gl.uniformMatrix4fv( this.particleSystem.uniforms.modelMatrix, false, _tempWorld.elements );
        gl.uniformMatrix4fv( this.particleSystem.uniforms.viewMatrix, false, viewMatrix.elements );
        gl.uniformMatrix4fv( this.particleSystem.uniforms.projectionMatrix, false, this.camera.projectionMatrix.elements );
        gl.uniformMatrix3fv( this.particleSystem.uniforms.normalMatrix, false, _tempNormal.elements );
        gl.uniform3f( this.particleSystem.uniforms.cameraPosition, this.camera.position.x, this.camera.position.y, this.camera.position.z );
    }

    updateTextureUniforms( positionTex ) {

        if(!this.isInit) return;

        let gl = this.ctx;

        gl.useProgram( this.particleSystem.program ); 

        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, positionTex );
        gl.uniform1i( this.particleSystem.uniforms.uInstancePosition, 0 );

        gl.activeTexture( gl.TEXTURE1 );
        gl.bindTexture( gl.TEXTURE_2D, positionTex );
        gl.uniform1i( this.particleSystem.uniforms.uInstanceVelocity, 1 );
    }

    destroy() {

        this.particleBehaviours.destroy();
        this.particleSystem.destroy();
    }
}
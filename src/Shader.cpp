#include "Shader.h"
using namespace std;

Shader::Shader(const char* vertexPath,const char* fragmentPath)
:vertexSource(nullptr), fragmentSource(nullptr)
{                   
    loadFile(vertexPath,fragmentPath);
    shaderCompile();
}
Shader::~Shader()
{
    delete[] vertexSource;
    delete[] fragmentSource;
}

void Shader::loadFile(const char* vertexPath,const char* fragmentPath)
{
    ifstream vertexFile, fragmentFile;
    stringstream vertexSStream, fragmentSStream;
    vertexFile.open(vertexPath);
    fragmentFile.open(fragmentPath);
    vertexFile.exceptions(ifstream::failbit || ifstream::badbit);
    fragmentFile.exceptions(ifstream::failbit || ifstream::badbit);

    try
    {
        if(!vertexFile.is_open() || !fragmentFile.is_open())
        {
            throw std::exception("---open file error---");
        }
        vertexSStream << vertexFile.rdbuf();
        fragmentSStream << fragmentFile.rdbuf();

        vertexString = vertexSStream.str();
        fragmentString = fragmentSStream.str();
        
        vertexSource = vertexString.c_str();
        fragmentSource = fragmentString.c_str(); 
    }
    catch(const std::exception& ex)
    {
        std::cerr << ex.what() << '\n';
    }  
    vertexFile.close();     // 正确的关闭流
    fragmentFile.close();   // 正确的关闭流
}

void Shader::shaderCompile()
{
    unsigned int vertex, fragment;

    vertex = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertex, 1, &vertexSource, nullptr);
    glCompileShader(vertex);
    checkCompileErrors(vertex,"VERTEX");

    fragment = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragment, 1, &fragmentSource, nullptr);
    glCompileShader(fragment);
    checkCompileErrors(fragment,"FRAGMENT");
    
    ID = glCreateProgram();
    glAttachShader(ID,vertex);
    glAttachShader(ID,fragment);
    glLinkProgram(ID);
    checkCompileErrors(ID,"PROGRAM");

    glDeleteShader(vertex);         // 用完记得删除
    glDeleteShader(fragment);       // 用完记得删除
    vertexSource = nullptr;         // 重要的容易出错的指针释放
    fragmentSource = nullptr;       // 重要的容易出错的指针释放
}

void Shader::use()
{
     glUseProgram(ID);
}
void Shader::checkCompileErrors(unsigned int ID,std::string type)
{
    int success;
    char infoLog[512];
    if (type != "PROGRAM")
    {
        glGetShaderiv(ID,GL_COMPILE_STATUS,&success);
        if(!success)
        {
            glGetShaderInfoLog(ID, 512, nullptr, infoLog);
            cout<<"shader compile error:"<<infoLog<<endl;
        } 
    }
    else
    {
        glGetProgramiv(ID, GL_LINK_STATUS, &success);
        if(!success)
        {
            glGetProgramInfoLog(ID, 512, nullptr, infoLog);
            cout<<"program linking error:"<<infoLog<<endl;
        }
    }
}
void Shader::setBool(const std::string &name, bool value) const
{
    glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value); 
}
void Shader::setInt(const std::string &name, int value) const
{ 
    glUniform1i(glGetUniformLocation(ID, name.c_str()), value); 
}
void Shader::setFloat(const std::string &name, float value) const
{ 
    glUniform1f(glGetUniformLocation(ID, name.c_str()), value); 
} 
void Shader::setUniform3f(const char* paramNameString, glm::vec3 param)
{
    glUniform3f(glGetUniformLocation(ID, paramNameString),
        param.x,param.y,param.z);
}

void Shader::setUniform1Img(const char *paramNameString, int slot)
{
    glUniform1i(glGetUniformLocation(ID, paramNameString), slot);
}
void Shader::setMat4(const std::string &name, const glm::mat4 &mat) const
{
    glUniformMatrix4fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
}

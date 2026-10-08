package com.example.vvitmedia.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;


@Entity 
@Table(name="users")
public class User {
    @Id 
    @GeneratedValue
    private String username;
    private String password;
    public User()
    {

    }
    
}
